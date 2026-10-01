import Alert from "../models/Alert.js";
import { User } from "../models/user.js"; // adjust path/export to your project

/** Create one alert for one user. Never throws. */
const formatAlertDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};
export const createAlert = async ({
    userId,
    type,
    severity = "info",
    title,
    message = "",
    link = null,
    meta = {},
    dedupeKey,
}) => {
    try {
        if (!userId) return null;

        return await Alert.create({
            user: userId,
            type,
            severity,
            title,
            message,
            link,
            meta,
            ...(dedupeKey ? { dedupeKey } : {}),
        });
    } catch (error) {
        if (error?.code === 11000) return null; // duplicate, already created
        console.error("createAlert failed:", error);
        return null;
    }
};

/** Same alert to a list of users. */
export const createAlertForUsers = async (userIds = [], payload) => {
    try {
        if (!userIds.length) return 0;
        const docs = userIds.map((id) => ({ ...payload, user: id }));
        const result = await Alert.insertMany(docs, { ordered: false });
        return result.length;
    } catch (error) {
        console.error("createAlertForUsers failed:", error);
        return 0;
    }
};

/** Same alert to ALL users (announcements). Batched so it scales. */
export const createAlertForAllUsers = async ({
    type = "announcement",
    severity = "info",
    title,
    message = "",
    link = null,
    meta = {},
}) => {
    let total = 0;
    let batch = [];

    const flush = async () => {
        if (!batch.length) return;
        try {
            await Alert.insertMany(batch, { ordered: false });
            total += batch.length;
        } catch (error) {
            console.error("Broadcast batch failed:", error);
        }
        batch = [];
    };

    try {
        const cursor = User.find({ isVerified: true }).select("_id").cursor();

        for await (const u of cursor) {
            batch.push({
                user: u._id,
                type,
                severity,
                title,
                message,
                link,
                meta,
                isBroadcast: true,
            });
            if (batch.length >= 500) await flush();
        }
        await flush();
    } catch (error) {
        console.error("createAlertForAllUsers failed:", error);
    }

    return total;
};

/* ---------- Ready-made templates: customize the wording here ---------- */

export const notify = {
    // ---------------------------------------------------------------------
    // USER / PROFILE
    // ---------------------------------------------------------------------

    welcome: (userId, name) =>
        createAlert({
            userId,
            type: "welcome",
            severity: "success",
            title: "Welcome to Bookie! 🎉",
            message: `Hi ${name || "there"}, create your first personalised story book.`,
            link: "/create",
            dedupeKey: "welcome",
        }),

    profileUpdated: (userId) =>
        createAlert({
            userId,
            type: "profile_updated",
            severity: "success",
            title: "Profile updated",
            message: "Your profile details were saved successfully.",
            link: "/profile",
        }),

    avatarUpdated: (userId) =>
        createAlert({
            userId,
            type: "avatar_updated",
            severity: "success",
            title: "Profile photo updated",
            message: "Your new profile photo is live.",
            link: "/profile",
        }),

    dataExportRequested: (userId) =>
        createAlert({
            userId,
            type: "data_export_requested",
            severity: "info",
            title: "Data export requested",
            message:
                "We're preparing your data. You'll be notified when it's ready.",
        }),

    // ---------------------------------------------------------------------
    // BOOKS
    // ---------------------------------------------------------------------

    bookStarted: (userId, bookId) =>
        createAlert({
            userId,
            type: "book_generation_started",
            severity: "info",
            title: "Your story is being created ✨",
            message:
                "We're writing and illustrating your book. This can take a few minutes.",
            link: "/books",
            meta: { bookId },
            dedupeKey: `book-started:${bookId}`,
        }),

    bookCompleted: (userId, bookId, title) =>
        createAlert({
            userId,
            type: "book_completed",
            severity: "success",
            title: "Your book is ready! 📖",
            message: `"${title}" has been created. Open it and start reading.`,
            link: `/books/${bookId}`,
            meta: { bookId },
            dedupeKey: `book-completed:${bookId}`,
        }),

    bookPartiallyFailed: (userId, bookId, title, failedPages) =>
        createAlert({
            userId,
            type: "book_partially_failed",
            severity: "warning",
            title: "Your book couldn't be fully finished",
            message: `"${title}": ${failedPages} page image(s) failed to generate. Please try again.`,
            link: "/books",
            meta: { bookId, failedPages },
            dedupeKey: `book-failed:${bookId}`,
        }),

    bookFailed: (userId, bookId, title = "Your story") =>
        createAlert({
            userId,
            type: "book_failed",
            severity: "error",
            title: "Book creation failed",
            message: `Something went wrong while creating "${title}". Please try again.`,
            link: "/create",
            meta: { bookId },
            dedupeKey: `book-failed:${bookId}`,
        }),

    planLimitReached: (userId, access) =>
        createAlert({
            userId,
            type: "plan_limit_reached",
            severity: "warning",
            title: "Book limit reached",
            message:
                access?.message ||
                "You've used all the books in your plan. Upgrade to create more.",
            link: "/pricing",
            meta: {
                limit: access?.limit,
                currentUsage: access?.currentUsage,
            },
        }),

    // ---------------------------------------------------------------------
    // SUBSCRIPTIONS
    // ---------------------------------------------------------------------

    subscriptionActivated: (userId, subscription, paymentId = null) =>
        createAlert({
            userId,
            type: "subscription_activated",
            severity: "success",
            title: "Subscription activated 🎉",
            message: `Your ${subscription?.planDisplayName || subscription?.planName || "subscription"} plan is now active.`,
            link: "/subscription",
            meta: {
                subscriptionId: subscription?._id,
                planName: subscription?.planName,
                planDisplayName: subscription?.planDisplayName,
                billingCycle: subscription?.billingCycle,
                amount: subscription?.amount,
                paymentId,
                startDate: subscription?.startDate,
                endDate: subscription?.endDate,
            },
            dedupeKey: paymentId
                ? `subscription-activated:${paymentId}`
                : `subscription-activated:${subscription?._id}`,
        }),

    subscriptionPaymentFailed: (userId) =>
        createAlert({
            userId,
            type: "subscription_payment_failed",
            severity: "error",
            title: "Subscription payment failed",
            message:
                "We couldn't verify your subscription payment. Please try again or contact support if you were charged.",
            link: "/pricing",
        }),

    subscriptionCancelled: (userId, subscription) =>
        createAlert({
            userId,
            type: "subscription_cancelled",
            severity: "warning",
            title: "Subscription cancellation scheduled",
            message: subscription?.endDate
                ? `Your subscription will remain active until ${formatAlertDate(
                    subscription.endDate
                )}. You can restore it before it expires.`
                : "Your subscription cancellation has been scheduled. You can restore it before it expires.",
            link: "/subscription",
            meta: {
                subscriptionId: subscription?._id,
                planName: subscription?.planName,
                billingCycle: subscription?.billingCycle,
                endDate: subscription?.endDate,
                cancelReason: subscription?.cancelReason,
            },
            dedupeKey: subscription?._id
                ? `subscription-cancelled:${subscription._id}:${subscription?.cancelledAt || ""}`
                : undefined,
        }),

    subscriptionRestored: (userId, subscription) =>
        createAlert({
            userId,
            type: "subscription_restored",
            severity: "success",
            title: "Subscription restored",
            message: `Your ${subscription?.planDisplayName || subscription?.planName || "subscription"} plan has been restored and will remain active until ${subscription?.endDate
                    ? formatAlertDate(subscription.endDate)
                    : "the end of your billing period"
                }.`,
            link: "/subscription",
            meta: {
                subscriptionId: subscription?._id,
                planName: subscription?.planName,
                billingCycle: subscription?.billingCycle,
                endDate: subscription?.endDate,
            },
            dedupeKey: subscription?._id
                ? `subscription-restored:${subscription._id}:${Date.now()}`
                : undefined,
        }),

    subscriptionExpired: (userId, subscription) =>
        createAlert({
            userId,
            type: "subscription_expired",
            severity: "warning",
            title: "Your subscription has expired",
            message: `Your ${subscription?.planDisplayName ||
                subscription?.planName ||
                "subscription"
                } plan has expired. Renew your subscription to continue using paid features.`,
            link: "/pricing",
            meta: {
                subscriptionId: subscription?._id,
                planName: subscription?.planName,
                billingCycle: subscription?.billingCycle,
                endDate: subscription?.endDate,
            },
            dedupeKey: subscription?._id
                ? `subscription-expired:${subscription._id}`
                : undefined,
        }),

    subscriptionExpiring: (userId, subscription, daysBefore = 3) =>
        createAlert({
            userId,
            type: "subscription_expiring",
            severity: "warning",
            title: "Your subscription is expiring soon ⏳",
            message: subscription?.endDate
                ? `Your ${subscription?.planDisplayName ||
                subscription?.planName ||
                "subscription"
                } plan expires on ${formatAlertDate(
                    subscription.endDate
                )}. Renew before it expires to keep your paid features.`
                : `Your ${subscription?.planDisplayName ||
                subscription?.planName ||
                "subscription"
                } plan is expiring soon. Renew to keep your paid features.`,
            link: "/pricing",
            meta: {
                subscriptionId: subscription?._id,
                planName: subscription?.planName,
                billingCycle: subscription?.billingCycle,
                endDate: subscription?.endDate,
                daysBefore,
            },
            dedupeKey: subscription?._id
                ? `subscription-expiring:${subscription._id}:${subscription?.endDate}`
                : undefined,
        }),
        // ---------------------------------------------------------------------
// ORDERS / PRINTED BOOKS
// ---------------------------------------------------------------------

paymentFailed: (userId, bookId = null) =>
    createAlert({
        userId,
        type: "payment_failed",
        severity: "error",
        title: "Payment verification failed",
        message:
            "We couldn't verify your payment. Please try the payment again. If you were charged, please contact support.",
        link: "/orders",
        meta: {
            bookId,
        },
    }),

orderConfirmed: (userId, order) =>
    createAlert({
        userId,
        type: "order_confirmed",
        severity: "success",
        title: "Order confirmed! 📦",
        message: order?.orderNumber
            ? `Your printed book order ${order.orderNumber} has been confirmed and is being prepared.`
            : "Your printed book order has been confirmed and is being prepared.",
        link: order?._id
            ? `/orders/${order._id}`
            : "/orders",
        meta: {
            orderId: order?._id,
            orderNumber: order?.orderNumber,
            bookId: order?.book,
            bookTitle: order?.bookTitle,
            amount: order?.amount,
            currency: order?.currency,
            status: order?.status,
            paymentStatus: order?.paymentStatus,
        },
        dedupeKey: order?._id
            ? `order-confirmed:${order._id}`
            : undefined,
    }),

orderCancelled: (userId, order) =>
    createAlert({
        userId,
        type: "order_cancelled",
        severity: "warning",
        title: "Order cancelled",
        message: order?.orderNumber
            ? `Your order ${order.orderNumber} has been cancelled.`
            : "Your printed book order has been cancelled.",
        link: order?._id
            ? `/orders/${order._id}`
            : "/orders",
        meta: {
            orderId: order?._id,
            orderNumber: order?.orderNumber,
            bookId: order?.book,
            bookTitle: order?.bookTitle,
            cancelReason: order?.cancelReason || "",
            cancelledAt: order?.cancelledAt || null,
            status: order?.status,
        },
        dedupeKey: order?._id
            ? `order-cancelled:${order._id}`
            : undefined,
    }),
};