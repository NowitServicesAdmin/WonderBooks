import crypto from "crypto";
import razorpay from "../config/razorpayClient.js";
import Subscription from "../models/subscription.js";
import { User } from "../models/user.js";
import Plan from "../models/plan.js";
import { getPlanConfig, getPlanPrice } from "../config/subscriptionPlans.js";

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
        const subscription = await Subscription.findOne({ userId: req.user._id }).lean();

        if (subscription) {
            const isCurrentlyActive =
                subscription.status === "active" &&
                subscription.endDate &&
                new Date(subscription.endDate).getTime() > Date.now();

            subscription.isCurrentlyActive = isCurrentlyActive;
            subscription.canRestore = !!subscription.cancelRequested && isCurrentlyActive;
        }

        res.json({ success: true, subscription: subscription || null });
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
                    planName: sub.planName,
                    billingCycle: sub.billingCycle,
                }))
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

        // FREE PLAN - no payment needed
        if (amount === 0) {
            return res.status(200).json({ success: true, requiresPayment: false });
        }

        // PAID PLAN - create a Razorpay order only
        const order = await razorpay.orders.create({
            amount: amount * 100, // paise
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
            billingCycle = freeBillingCycle || "monthly";

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
                return res.status(400).json({ success: false, message: "Payment verification failed" });
            }

            const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

            planName = razorpayOrder.notes?.planName;
            billingCycle = razorpayOrder.notes?.billingCycle || "monthly";
            const orderUserId = razorpayOrder.notes?.userId;

            if (!planName) {
                return res.status(400).json({ success: false, message: "Plan information not found in Razorpay order" });
            }
            if (orderUserId !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: "Payment does not belong to this user" });
            }

            amount = await getPlanPrice(planName, billingCycle);
            if (amount === null || amount === 0) {
                return res.status(400).json({ success: false, message: "Invalid paid subscription plan" });
            }

            orderId = razorpay_order_id;
            paymentId = razorpay_payment_id;
        }

        const plan = await Plan.findOne({ planId: planName }).lean();

        let subscription = await Subscription.findOne({ userId: req.user._id });

        const startDate = new Date();
        const endDate = computeEndDate(startDate, billingCycle);

        if (!subscription) {
            subscription = new Subscription({
                userId: req.user._id,
                planName,
                planDisplayName: plan?.name || planName,
                billingCycle,
                status: "active",
                amount,
                currency: "INR",
                startDate,
                endDate,
                cancelRequested: false,
                paymentHistory: [],
            });
        } else {
            subscription.planName = planName;
            subscription.planDisplayName = plan?.name || planName;
            subscription.billingCycle = billingCycle;
            subscription.status = "active";
            subscription.amount = amount;
            subscription.currency = "INR";
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.cancelRequested = false;
            subscription.cancelledAt = null;
            subscription.cancelReason = "";
        }

        subscription.paymentHistory.push({
            orderId,
            paymentId,
            amount,
            currency: "INR",
            status: "paid",
            planName,
            billingCycle,
            startDate,
            endDate,
            paidAt: new Date(),
        });

        await subscription.save();
        await syncUserFromSubscription(req.user._id, subscription);

        return res.status(200).json({
            success: true,
            message: "Subscription activated successfully",
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
        if (subscription.status !== "active") {
            return res.status(400).json({ success: false, message: "Subscription is not active" });
        }
        if (subscription.cancelRequested) {
            return res.status(400).json({ success: false, message: "Subscription is already cancelled" });
        }

        subscription.cancelRequested = true;
        subscription.cancelledAt = new Date();
        subscription.cancelReason = reason;

        await subscription.save();
        await syncUserFromSubscription(req.user._id, subscription);

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

        return res.status(200).json({ success: true, message: "Subscription restored", subscription });
    } catch (error) {
        console.error("restoreSubscription error:", error);
        return res.status(500).json({ success: false, message: "Unable to restore subscription" });
    }
};

// -------------------------------------------------------------------------
// Not a route - wire this into a daily cron (e.g. node-cron) to flip
// subscriptions whose endDate has passed to "expired". Optional for an
// initial launch; nothing else in this feature depends on it running.
// -------------------------------------------------------------------------
export const expireOutdatedSubscriptions = async () => {
    const now = new Date();
    const expired = await Subscription.find({ status: "active", endDate: { $lt: now } });

    for (const sub of expired) {
        sub.status = "expired";
        await sub.save();
        await syncUserFromSubscription(sub.userId, sub);
    }

    return expired.length;
};
