import crypto from "crypto";
import mongoose from "mongoose";
import Plan from "../models/plan.js";
import Subscription from "../models/subscription.js";
import { User } from "../models/user.js";
import { getPlanPrice } from "../config/subscriptionPlans.js";
import { notify } from "../services/alertService.js";
import {
    applySubscription,
    syncUserFromSubscription,
    withUserLock,
} from "./subscriptionController.js";

// -------------------------------------------------------------------------
// Env vars
//   REVENUECAT_WEBHOOK_AUTH  exact value of the "Authorization header" you set
//                            on the webhook in the RevenueCat dashboard
//   REVENUECAT_SECRET_KEY    RevenueCat *secret* API key (used by /sync-store)
// -------------------------------------------------------------------------

// Must match productIdFor() in the app (revenuecat.ts).
const slug = (s) =>
    String(s ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const parseProductId = (productId) => {
    const m = /^(.*)_(monthly|yearly)$/.exec(String(productId ?? ""));
    return m ? { planSlug: m[1], billingCycle: m[2] } : null;
};

// "basic_monthly" -> { planName: <Plan.planId>, billingCycle: "monthly" }
const resolvePlan = async (productId) => {
    const parsed = parseProductId(productId);
    if (!parsed) return null;
    const plans = await Plan.find().lean();
    const plan =
        plans.find((p) => slug(p.planId) === parsed.planSlug) ||
        plans.find((p) => slug(p.name) === parsed.planSlug);
    return plan ? { planName: plan.planId, billingCycle: parsed.billingCycle } : null;
};

const safeEqual = (a, b) => {
    const x = Buffer.from(String(a ?? ""));
    const y = Buffer.from(String(b ?? ""));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const ms = (v) => (v == null ? null : new Date(Number(v)));

// The app passes the Mongo user _id as RevenueCat's app_user_id.
const findUserId = async (event) => {
    const candidates = [event.app_user_id, event.original_app_user_id, ...(event.aliases || [])];
    for (const id of candidates) {
        if (id && mongoose.isValidObjectId(id) && (await User.exists({ _id: id }))) {
            return String(id);
        }
    }
    return null;
};

// Runs fn on the user's subscription, only if it is an App Store subscription.
// fn may return false to skip saving.
const mutateAppleSubscription = (userId, fn) =>
    withUserLock(userId, async () => {
        const sub = await Subscription.findOne({ userId });
        if (!sub || sub.store !== "app_store") return null;
        if ((await fn(sub)) === false) return null;
        await sub.save();
        await syncUserFromSubscription(userId, sub);
        return sub;
    });

const handlePurchase = async (userId, event, eventAt) => {
    const target = await resolvePlan(event.product_id);
    if (!target) {
        console.warn("[revenuecat] unknown product_id:", event.product_id);
        return;
    }

    const startDate = ms(event.purchased_at_ms) || eventAt;
    const endDate = ms(event.expiration_at_ms);
    if (!endDate || endDate.getTime() <= Date.now()) return; // already lapsed; EXPIRATION covers it

    // `price_in_purchased_currency` is what the user was charged (store currency);
    // `price` is USD. Trials are price 0 and are not recorded as payments.
    const local = event.price_in_purchased_currency;
    const charged = Number(local ?? event.price ?? 0) || 0;
    const currency = local != null ? event.currency || "INR" : "USD";
    const catalog = Number(await getPlanPrice(target.planName, target.billingCycle)) || 0;

    const { subscription, alreadyApplied } = await applySubscription({
        userId,
        ...target,
        amount: charged || catalog,
        currency,
        startDate,
        endDate,
        orderId: event.original_transaction_id || null,
        paymentId: event.transaction_id || null,
        store: "app_store",
        recordPayment: charged > 0,
        extra: {
            storeOriginalTransactionId: event.original_transaction_id || null,
            storeLastEventAt: eventAt,
        },
    });

    if (!alreadyApplied && (event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL")) {
        await notify.subscriptionActivated(userId, subscription, event.transaction_id || null);
    }
};

// -------------------------------------------------------------------------
// POST /api/subscriptions/revenuecat-webhook
// Public route (no user auth) - protected by the shared Authorization header.
// Return 2xx when handled/ignored, 5xx only for errors worth retrying.
// -------------------------------------------------------------------------
export const revenueCatWebhook = async (req, res) => {
    const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
    if (!expected) {
        console.error("[revenuecat] REVENUECAT_WEBHOOK_AUTH is not set");
        return res.status(500).json({ success: false });
    }
    if (!safeEqual(req.headers.authorization, expected)) {
        return res.status(401).json({ success: false });
    }

    try {
        const event = req.body?.event;
        if (!event?.type) return res.status(400).json({ success: false, message: "Missing event" });
        if (event.type === "TEST") return res.status(200).json({ success: true });

        const userId = await findUserId(event);
        if (!userId) {
            console.warn("[revenuecat] no matching user for", event.type, event.app_user_id);
            return res.status(200).json({ success: true });
        }

        const eventAt = ms(event.event_timestamp_ms) || new Date();

        // Ignore events older than one we've already applied (out-of-order delivery).
        const current = await Subscription.findOne({ userId }).select("storeLastEventAt").lean();
        if (current?.storeLastEventAt && eventAt.getTime() < new Date(current.storeLastEventAt).getTime()) {
            return res.status(200).json({ success: true });
        }

        switch (event.type) {
            case "INITIAL_PURCHASE":
            case "RENEWAL":
            case "SUBSCRIPTION_EXTENDED":
                await handlePurchase(userId, event, eventAt);
                break;

            case "PRODUCT_CHANGE": {
                const target = await resolvePlan(event.new_product_id || event.product_id);
                if (!target) break;
                await mutateAppleSubscription(userId, (s) => {
                    s.planName = target.planName;
                    s.billingCycle = target.billingCycle;
                    s.storeLastEventAt = eventAt;
                });
                break;
            }

            case "CANCELLATION": {
                // CUSTOMER_SUPPORT = refunded by Apple -> revoke access now.
                const refunded = event.cancel_reason === "CUSTOMER_SUPPORT";
                const sub = await mutateAppleSubscription(userId, (s) => {
                    if (refunded) {
                        s.status = "expired";
                        s.endDate = new Date();
                    } else {
                        s.cancelRequested = true;
                        s.cancelledAt = eventAt;
                        s.cancelReason = event.cancel_reason || "Cancelled in App Store";
                    }
                    s.storeLastEventAt = eventAt;
                });
                if (sub) {
                    if (refunded) await notify.subscriptionExpired(userId, sub);
                    else await notify.subscriptionCancelled(userId, sub);
                }
                break;
            }

            case "UNCANCELLATION": {
                const sub = await mutateAppleSubscription(userId, (s) => {
                    s.cancelRequested = false;
                    s.cancelledAt = null;
                    s.cancelReason = "";
                    s.storeLastEventAt = eventAt;
                });
                if (sub) await notify.subscriptionRestored(userId, sub);
                break;
            }

            case "EXPIRATION": {
                const sub = await mutateAppleSubscription(userId, (s) => {
                    const expiredAt = ms(event.expiration_at_ms) || eventAt;
                    if (s.endDate && s.endDate.getTime() > expiredAt.getTime()) return false; // renewed since
                    s.status = "expired";
                    s.endDate = expiredAt;
                    s.storeLastEventAt = eventAt;
                });
                if (sub) await notify.subscriptionExpired(userId, sub);
                break;
            }

            default:
                // BILLING_ISSUE, TRANSFER, etc. - acknowledged, no state change.
                break;
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("[revenuecat] webhook error:", error);
        return res.status(500).json({ success: false });
    }
};

// -------------------------------------------------------------------------
// POST /api/subscriptions/sync-store      (requires user auth)
// Called by the app right after an iOS purchase / restore so the UI doesn't
// have to wait for the webhook. Pulls the user's state from RevenueCat's REST
// API and applies it (without recording a payment - the webhook does that).
// -------------------------------------------------------------------------
export const syncStoreSubscription = async (req, res) => {
    try {
        const key = process.env.REVENUECAT_SECRET_KEY;
        if (!key) {
            return res.status(503).json({ success: false, message: "Store sync is not configured" });
        }

        const userId = req.user._id;
        const rc = await fetch(
            `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(String(userId))}`,
            { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }
        );
        if (!rc.ok) {
            return res.status(502).json({ success: false, message: "Could not reach the store service" });
        }

        const { subscriber } = await rc.json();
        const now = Date.now();

        // Latest still-valid App Store subscription.
        const live = Object.entries(subscriber?.subscriptions || {})
            .filter(([, s]) => s.store === "app_store" && s.expires_date && new Date(s.expires_date).getTime() > now)
            .sort((a, b) => new Date(b[1].expires_date) - new Date(a[1].expires_date))[0];

        if (!live) return res.status(200).json({ success: true, synced: false });

        const [productId, s] = live;
        const target = await resolvePlan(productId);
        if (!target) return res.status(200).json({ success: true, synced: false });

        const endDate = new Date(s.expires_date);
        const existing = await Subscription.findOne({ userId })
            .select("planName billingCycle endDate status store")
            .lean();

        // Don't clobber a longer-running Razorpay plan with a shorter Apple one.
        const razorpayLive =
            existing &&
            existing.store !== "app_store" &&
            existing.status === "active" &&
            existing.endDate &&
            new Date(existing.endDate).getTime() > endDate.getTime();

        const unchanged =
            existing &&
            existing.planName === target.planName &&
            existing.billingCycle === target.billingCycle &&
            existing.endDate &&
            new Date(existing.endDate).getTime() === endDate.getTime();

        if (!razorpayLive && !unchanged) {
            const catalog = Number(await getPlanPrice(target.planName, target.billingCycle)) || 0;
            await applySubscription({
                userId,
                ...target,
                amount: catalog,
                currency: "INR",
                startDate: s.purchase_date ? new Date(s.purchase_date) : new Date(),
                endDate,
                store: "app_store",
                recordPayment: false,
                cancelRequested: !!s.unsubscribe_detected_at,
            });
        }

        return res.status(200).json({ success: true, synced: !razorpayLive });
    } catch (error) {
        console.error("[revenuecat] syncStoreSubscription error:", error);
        return res.status(500).json({ success: false, message: "Unable to sync subscription" });
    }
};