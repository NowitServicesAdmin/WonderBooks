import Subscription from "../models/subscription.js";
import Plan from "../models/plan.js";
import book from "../models/book.js";

export const COMPONENT_LIMITS = {
    book: {
        basic: 1,
        gold: 5,
        premium: 10,
        default: 0,
    },
};


export const MIN_BOOK_LIMIT = 1;
export const MAX_BOOK_LIMIT = 10;

const TIER_KEYS = ["basic", "gold", "premium"];


export const normalizePlanKey = (value = "") => {
    const cleaned = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");

    return TIER_KEYS.find((key) => cleaned.includes(key)) || cleaned || "default";
};

export const getFeatureLimit = ({ plan, subscription, component }) => {
    const override = plan?.limits?.[component];
    if (override !== undefined && override !== null) {
        const n = Number(override);
        if (component === "book") {
            return Math.min(Math.max(n, 0), MAX_BOOK_LIMIT);
        }
        return n;
    }

    const planKey = normalizePlanKey(
        subscription?.planName || plan?.planId || plan?.name || "default"
    );
    const planLimits = COMPONENT_LIMITS[component] || {};

    if (planLimits[planKey] !== undefined) return Number(planLimits[planKey]);
    if (planLimits.default !== undefined) return Number(planLimits.default);
    return 0;
};

const getActiveSubscription = (userId) =>
    Subscription.findOne({
        userId,
        status: "active",
        endDate: { $gt: new Date() },
    })
        .sort({ createdAt: -1 })
        .lean();

export const getBookUsage = (userId) =>
    book.countDocuments({ user: userId, status: { $ne: "failed" } });

const result = (allowed, reason, extra) => ({
    allowed,
    reason,
    isSubscribed: false,
    subscriptionType: null,
    component: "book",
    limit: 0,
    currentUsage: 0,
    remaining: 0,
    message: "",
    ...extra,
});

export const canAccessFeature = async ({ userId, component = "book" }) => {
    const currentUsage = component === "book" ? await getBookUsage(userId) : 0;

    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
        return result(false, "SUBSCRIPTION_REQUIRED", {
            component,
            currentUsage,
            message: "Choose a plan to start creating books.",
        });
    }

    const plan = await Plan.findOne({ planId: subscription.planName }).lean();
    const limit = getFeatureLimit({ plan, subscription, component });
    const base = {
        isSubscribed: true,
        subscriptionType: subscription.billingCycle || "monthly",
        component,
        limit,
        currentUsage,
    };

    if (limit === 0) {
        return result(false, "FEATURE_NOT_INCLUDED", {
            ...base,
            message: "This feature is not included in your plan.",
        });
    }

    if (limit === -1) {
        return result(true, "ALLOWED", {
            ...base,
            remaining: -1,
            message: "Unlimited access.",
        });
    }

    if (currentUsage >= limit) {
        return result(false, "LIMIT_REACHED", {
            ...base,
            remaining: 0,
            message: `You've used all ${limit} book${limit === 1 ? "" : "s"} in your plan. Upgrade to create more.`,
        });
    }

    return result(true, "ALLOWED", {
        ...base,
        remaining: limit - currentUsage,
        message: "Feature access allowed.",
    });
};