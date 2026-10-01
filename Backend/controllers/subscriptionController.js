import crypto from "crypto";
import razorpay from "../config/razorpayClient.js";
import Subscription from "../models/subscription.js";
import { User } from "../models/user.js";
import Plan from "../models/plan.js";
import { getPlanConfig, getPlanPrice } from "../config/subscriptionPlans.js";
import { canAccessFeature } from "../config/subscriptionLimits.js";
import { notify } from "../services/alertService.js"; // ALERTS

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

const computeEndDate = (startDate, billingCycle) => {
    const end = new Date(startDate);
    if (billingCycle === "yearly") {
        end.setFullYear(end.getFullYear() + 1);
    } else {
        end.setMonth(end.getMonth() + 1);
    }
    return end;
};

// Keeps the quick-access fields on User in sync with a Subscription doc,
// so the rest of the app can check `user.isSubscribed` without a lookup.
const syncUserFromSubscription = async (userId, subscription) => {
    await User.findByIdAndUpdate(userId, {
        isSubscribed: subscription.status === "active",
        subscriptionStatus: subscription.status,
        subscriptionPlan: subscription.planName,
        subscriptionType: subscription.billingCycle,
        subscriptionStartDate: subscription.startDate,
        subscriptionEndDate: subscription.endDate,
        subscriptionCancelled: subscription.cancelRequested,
        currentSubscriptionId: subscription._id,
        subscribedOn: subscription.startDate,
    });
};

const isLive = (sub) =>
    Boolean(
        sub &&
            sub.status === "active" &&
            sub.endDate &&
            new Date(sub.endDate).getTime() > Date.now()
    );

const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Flips one subscription to "expired" if its endDate has passed.
const expireIfNeeded = async (subscription) => {
    if (
        subscription &&
        subscription.status === "active" &&
        subscription.endDate &&
        new Date(subscription.endDate).getTime() <= Date.now()
    ) {
        subscription.status = "expired";
        await subscription.save();
        await syncUserFromSubscription(subscription.userId, subscription);
        await notify.subscriptionExpired(subscription.userId, subscription); // ALERTS
    }
};

const getPurchaseBlock = (existing, planName, isFreePlan) => {
    if (!isLive(existing)) return null;

    if (isFreePlan) {
        return {
            code: "PLAN_STILL_ACTIVE",
            message: `You already have an active plan until ${formatDate(existing.endDate)}. You can switch to the free plan after it ends.`,
        };
    }

    const isPaidPlan = existing.amount > 0;

    if (existing.planName === planName && isPaidPlan) {
        return {
            code: "ALREADY_SUBSCRIBED",
            message: existing.cancelRequested
                ? `This plan is still active until ${formatDate(existing.endDate)}. Restore it instead of buying again.`
                : "You're already on this plan.",
        };
    }

    if (isPaidPlan && !existing.cancelRequested) {
        return {
            code: "ALREADY_SUBSCRIBED",
            message: "You already have an active plan. Cancel it first to switch to a different one.",
        };
    }

    return null;
};

const userLocks = new Map();
const withUserLock = async (userId, fn) => {
    const key = String(userId);
    const previous = userLocks.get(key) || Promise.resolve();
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    const chain = previous.then(() => gate);
    userLocks.set(key, chain);

    await previous;
    try {
        return await fn();
    } finally {
        release();
        if (userLocks.get(key) === chain) userLocks.delete(key);
    }
};

const applySubscription = ({ userId, planName, billingCycle, amount, orderId = null, paymentId = null }) =>
    withUserLock(userId, async () => {
        const plan = await Plan.findOne({ planId: planName }).lean();

        const startDate = new Date();
        const endDate = computeEndDate(startDate, billingCycle);

        const fields = {
            planName,
            planDisplayName: plan?.name || planName,
            billingCycle,
            status: "active",
            amount,
            currency: "INR",
            startDate,
            endDate,
            cancelRequested: false,
            cancelledAt: null,
            cancelReason: "",
        };

        const historyEntry = {
            orderId,
            paymentId,
            amount,
            currency: "INR",
            status: "paid",
            planName,
            billingCycle,
            startDate,
            endDate,
            paidAt: startDate,
            createdAt: startDate,
            updatedAt: startDate,
        };

        // Atomic: matches only if this payment isn't already in the history.
        const filter = { userId };
        if (paymentId) filter["paymentHistory.paymentId"] = { $ne: paymentId };

        let subscription = await Subscription.findOneAndUpdate(
            filter,
            { $set: fields, $push: { paymentHistory: historyEntry } },
            { new: true }
        );

        if (!subscription) {
            const existing = await Subscription.findOne({ userId });
            if (existing) {
                // The doc exists, so the only reason the update didn't match
                // is that this payment was already recorded.
                return { subscription: existing, alreadyApplied: true };
            }

            subscription = await Subscription.create({
                userId,
                ...fields,
                paymentHistory: [historyEntry],
            });
        }

        await syncUserFromSubscription(userId, subscription);
        return { subscription, alreadyApplied: false };
    });

// -------------------------------------------------------------------------
// GET /api/subscriptions/plans
// Public plan catalog - used to render the pricing cards.
// -------------------------------------------------------------------------
export const getPlans = async (req, res) => {
    try {
        const config = await getPlanConfig();
        res.json({ success: true, ...config });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to load plans", error: err.message });
    }
};

// -------------------------------------------------------------------------
// GET /api/subscriptions/me
// The user's current subscription document (one per user).
// -------------------------------------------------------------------------
export const getMySubscription = async (req, res) => {
    try {
        const doc = await Subscription.findOne({ userId: req.user._id });

        // Lazy expiry: a plan whose endDate has passed is marked expired the
        // moment its owner looks at it, without waiting for the hourly job.
        if (doc) await expireIfNeeded(doc);

        const subscription = doc ? doc.toObject() : null;

        if (subscription) {
            const isCurrentlyActive = isLive(subscription);
            subscription.isCurrentlyActive = isCurrentlyActive;
            subscription.canRestore = !!subscription.cancelRequested && isCurrentlyActive;
        }

        // Books used / allowed on the current plan, for the "2 of 5 books" UI.
        const bookAccess = await canAccessFeature({ userId: req.user._id, component: "book" });

        res.json({ success: true, subscription, bookAccess });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch subscription", error: err.message });
    }
};

// -------------------------------------------------------------------------
// GET /api/subscriptions/history
// Kept for symmetry with the reference implementation. WonderBook stores
// one Subscription doc per user (payment history lives inside it), so this
// just returns that single doc wrapped in an array - a future version
// that creates a new doc per plan-switch can return more here without any
// frontend change.
// -------------------------------------------------------------------------
export const getMySubscriptionHistory = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, subscriptions });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch history", error: err.message });
    }
};

// -------------------------------------------------------------------------
// GET /api/subscriptions/payment-history
// Every individual payment, flattened and sorted newest-first.
// -------------------------------------------------------------------------
export const getMyPaymentHistory = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ userId: req.user._id })
            .select("planName billingCycle paymentHistory")
            .lean();

        const payments = subscriptions
            .flatMap((sub) =>
                (sub.paymentHistory || []).map((p) => ({
                    ...p,
                    planName: p.planName || sub.planName,
                    billingCycle: p.billingCycle || sub.billingCycle,
                }))
            )
            .sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt));

        res.json({ success: true, payments });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch payment history", error: err.message });
    }
};

// -------------------------------------------------------------------------
// POST /api/subscriptions/initiate
// Body: { planName, billingCycle }
//
// Free plan -> nothing to pay, caller should call /activate directly with
// no Razorpay fields (see activateSubscription below).
// Paid plan -> creates a real Razorpay order and returns it so the client
// can open Checkout. No Subscription/payment row is written yet - that
// only happens once the signature is verified in /activate, so an
// abandoned checkout never leaves a stray "pending" record behind.
//
// Refuses (409) when the user isn't allowed to start this plan right now -
// see getPurchaseBlock. This is what guarantees nobody pays for something
// they can't have.
// -------------------------------------------------------------------------
export const initiateSubscription = async (req, res) => {
    try {
        const { planName, billingCycle = "monthly" } = req.body;

        if (!planName) {
            return res.status(400).json({ success: false, message: "planName is required" });
        }
        if (!["monthly", "yearly"].includes(billingCycle)) {
            return res.status(400).json({ success: false, message: "billingCycle must be monthly or yearly" });
        }

        const amount = await getPlanPrice(planName, billingCycle);

        if (amount === null) {
            return res.status(400).json({ success: false, message: "Invalid plan" });
        }

        const existing = await Subscription.findOne({ userId: req.user._id }).lean();
        const block = getPurchaseBlock(existing, planName, amount === 0);
        if (block) {
            return res.status(409).json({ success: false, ...block });
        }

        // FREE PLAN - no payment needed
        if (amount === 0) {
            return res.status(200).json({ success: true, requiresPayment: false });
        }

        // PAID PLAN - create a Razorpay order only
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // paise
            currency: "INR",
            receipt: `subscription_${req.user._id}_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                planName,
                billingCycle,
            },
        });

        return res.status(200).json({
            success: true,
            requiresPayment: true,
            order,
            keyId: process.env.RAZORPAY_KEY,
        });
    } catch (error) {
        console.error("initiateSubscription error:", error);
        return res.status(500).json({ success: false, message: "Unable to initiate subscription payment" });
    }
};

// -------------------------------------------------------------------------
// POST /api/subscriptions/activate
//
// Paid plan: body = { razorpay_order_id, razorpay_payment_id,
// razorpay_signature, planName, billingCycle } - verifies the Razorpay
// signature before activating; this is the piece that actually confirms
// the payment happened rather than trusting the client.
//
// Free plan: body = { planName, billingCycle } only (no razorpay_* fields)
// - activates immediately, no signature to check.
//
// Safe to call more than once for the same payment: the second call finds
// the payment already recorded and just returns the existing subscription
// (no new period, no book-count reset).
// -------------------------------------------------------------------------
export const activateSubscription = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planName: freePlanName,
            billingCycle: freeBillingCycle,
        } = req.body;

        const isFreeActivation = !razorpay_order_id && !razorpay_payment_id;

        let planName;
        let billingCycle;
        let amount;
        let orderId = null;
        let paymentId = null;

        if (isFreeActivation) {
            // -------------------- FREE PLAN --------------------
            planName = freePlanName;
            billingCycle = freeBillingCycle === "yearly" ? "yearly" : "monthly";

            if (!planName) {
                return res.status(400).json({ success: false, message: "planName is required" });
            }

            amount = await getPlanPrice(planName, billingCycle);

            if (amount === null) {
                return res.status(400).json({ success: false, message: "Invalid plan" });
            }
            if (amount !== 0) {
                return res.status(400).json({ success: false, message: "This plan requires payment - call /initiate first" });
            }

            const existing = await Subscription.findOne({ userId: req.user._id }).lean();
            const block = getPurchaseBlock(existing, planName, true);
            if (block) {
                return res.status(409).json({ success: false, ...block });
            }
        } else {
            // -------------------- PAID PLAN --------------------
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({ success: false, message: "Missing Razorpay payment details" });
            }

            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                await notify.subscriptionPaymentFailed(req.user._id); // ALERTS
                return res.status(400).json({ success: false, message: "Payment verification failed" });
            }

            const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

            planName = razorpayOrder.notes?.planName;
            billingCycle = razorpayOrder.notes?.billingCycle === "yearly" ? "yearly" : "monthly";
            const orderUserId = razorpayOrder.notes?.userId;

            if (!planName) {
                return res.status(400).json({ success: false, message: "Plan information not found in Razorpay order" });
            }
            if (orderUserId !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: "Payment does not belong to this user" });
            }

            // The order was created by /initiate with a server-side price, so
            // what Razorpay actually charged is the truth - even if admin
            // changed the plan price while the checkout was open.
            amount = Number(razorpayOrder.amount) / 100;
            if (!Number.isFinite(amount) || amount <= 0) {
                return res.status(400).json({ success: false, message: "Invalid paid subscription plan" });
            }

            const plan = await Plan.findOne({ planId: planName }).lean();
            if (!plan) {
                return res.status(400).json({
                    success: false,
                    message: "This plan no longer exists. Your payment was received - please contact support.",
                });
            }

            orderId = razorpay_order_id;
            paymentId = razorpay_payment_id;
        }

        const { subscription, alreadyApplied } = await applySubscription({
            userId: req.user._id,
            planName,
            billingCycle,
            amount,
            orderId,
            paymentId,
        });

        // ALERTS: only for a genuinely new activation, not a repeated call.
        if (!alreadyApplied) {
            await notify.subscriptionActivated(req.user._id, subscription, paymentId);
        }

        return res.status(200).json({
            success: true,
            message: alreadyApplied ? "Subscription already activated" : "Subscription activated successfully",
            subscription,
        });
    } catch (error) {
        console.error("activateSubscription error:", error);
        return res.status(500).json({ success: false, message: "Failed to activate subscription" });
    }
};

// -------------------------------------------------------------------------
// PATCH /api/subscriptions/cancel
// Body: { reason }
//
// SOFT cancel: the user already paid for this billing period in full and
// it's non-refundable, so `status`/`endDate` are left untouched - access
// continues right up to endDate. This just sets `cancelRequested`, which
// the frontend uses to unlock other plan buttons and offer "Restore".
// -------------------------------------------------------------------------
export const cancelSubscription = async (req, res) => {
    try {
        const { reason = "" } = req.body;

        const subscription = await Subscription.findOne({ userId: req.user._id });

        if (!subscription) {
            return res.status(404).json({ success: false, message: "No subscription found" });
        }
        if (!subscription.isCurrentlyActive()) {
            return res.status(400).json({ success: false, message: "Subscription is not active" });
        }
        if (!(subscription.amount > 0)) {
            return res.status(400).json({ success: false, message: "The free plan can't be cancelled" });
        }
        if (subscription.cancelRequested) {
            return res.status(400).json({ success: false, message: "Subscription is already cancelled" });
        }

        subscription.cancelRequested = true;
        subscription.cancelledAt = new Date();
        subscription.cancelReason = reason;

        await subscription.save();
        await syncUserFromSubscription(req.user._id, subscription);

        await notify.subscriptionCancelled(req.user._id, subscription); // ALERTS

        return res.status(200).json({
            success: true,
            message:
                "Subscription cancelled. You'll keep access until it expires - no refund is issued, and you can restore it any time before then.",
            subscription,
        });
    } catch (error) {
        console.error("cancelSubscription error:", error);
        return res.status(500).json({ success: false, message: "Unable to cancel subscription" });
    }
};

// -------------------------------------------------------------------------
// PATCH /api/subscriptions/restore
// Undoes a pending cancellation, as long as the subscription hasn't
// expired and nothing new was purchased since.
// -------------------------------------------------------------------------
export const restoreSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.user._id });

        if (!subscription) {
            return res.status(404).json({ success: false, message: "No subscription found" });
        }
        if (!subscription.cancelRequested) {
            return res.status(400).json({ success: false, message: "This subscription isn't cancelled, nothing to restore" });
        }
        if (!subscription.isCurrentlyActive()) {
            return res.status(400).json({ success: false, message: "This subscription has already expired and can no longer be restored" });
        }

        subscription.cancelRequested = false;
        subscription.cancelledAt = null;
        subscription.cancelReason = "";

        await subscription.save();
        await syncUserFromSubscription(req.user._id, subscription);

        await notify.subscriptionRestored(req.user._id, subscription); // ALERTS

        return res.status(200).json({ success: true, message: "Subscription restored", subscription });
    } catch (error) {
        console.error("restoreSubscription error:", error);
        return res.status(500).json({ success: false, message: "Unable to restore subscription" });
    }
};

// -------------------------------------------------------------------------
// Not a route - app.js runs this on boot and then hourly to flip
// subscriptions whose endDate has passed to "expired". Book limits don't
// depend on it (they check endDate directly); it keeps user.isSubscribed and
// the admin lists accurate.
// -------------------------------------------------------------------------
export const expireOutdatedSubscriptions = async () => {
    const now = new Date();
    const expired = await Subscription.find({ status: "active", endDate: { $lt: now } });

    for (const sub of expired) {
        sub.status = "expired";
        await sub.save();
        await syncUserFromSubscription(sub.userId, sub);
        await notify.subscriptionExpired(sub.userId, sub); // ALERTS
    }

    return expired.length;
};

// -------------------------------------------------------------------------
// ALERTS (new, optional): "your plan ends soon" reminder for paid plans.
// Not a route and not called anywhere yet. To use it, call it from the same
// place that runs expireOutdatedSubscriptions (app.js), e.g. once an hour.
// The dedupeKey on the alert means each user is reminded only once per
// billing period, however often this runs.
// -------------------------------------------------------------------------
export const notifyExpiringSubscriptions = async (daysBefore = 3) => {
    const now = new Date();
    const soon = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);

    const expiring = await Subscription.find({
        status: "active",
        amount: { $gt: 0 },
        endDate: { $gt: now, $lte: soon },
    })
        .select("userId planName planDisplayName endDate cancelRequested")
        .lean();

    for (const sub of expiring) {
        await notify.subscriptionExpiring(sub.userId, sub);
    }

    return expiring.length;
};