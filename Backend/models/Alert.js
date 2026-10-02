import mongoose from "mongoose";

export const ALERT_TYPES = [
    // ---------------------------------------------------------------------
    // ACCOUNT
    // ---------------------------------------------------------------------
    "welcome",
    "profile_updated",
    "avatar_updated",
    "data_export_requested",

    // ---------------------------------------------------------------------
    // BOOKS
    // ---------------------------------------------------------------------
    "book_generation_started",
    "book_completed",
    "book_partially_failed",
    "book_failed",
    "plan_limit_reached",

    // ---------------------------------------------------------------------
    // SUBSCRIPTIONS
    // ---------------------------------------------------------------------
    "subscription_activated",
    "subscription_payment_failed",
    "subscription_cancelled",
    "subscription_restored",
    "subscription_expired",
    "subscription_expiring",

    // ---------------------------------------------------------------------
    // ORDERS / PRINTED BOOKS
    // ---------------------------------------------------------------------
    "payment_failed",
    "order_confirmed",
    "order_cancelled",

    // ---------------------------------------------------------------------
    // ADMIN
    // ---------------------------------------------------------------------
    "announcement",
];

const alertSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ALERT_TYPES,
            required: true,
        },
        severity: {
            type: String,
            enum: ["info", "success", "warning", "error"],
            default: "info",
        },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        message: { type: String, trim: true, default: "", maxlength: 500 },

        // frontend route to open when the alert is clicked, e.g. /books/123
        link: { type: String, default: null },

        // any extra data (bookId, limit, etc.)
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },

        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },

        // true when sent to everyone by an admin
        isBroadcast: { type: Boolean, default: false },

        // prevents duplicates, e.g. "book-completed:<bookId>"
        dedupeKey: { type: String, default: undefined },

        // auto-delete old alerts after 90 days
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
    },
    { timestamps: true }
);

alertSchema.index({ user: 1, createdAt: -1 });
alertSchema.index({ user: 1, isRead: 1, createdAt: -1 });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
alertSchema.index(
    { user: 1, dedupeKey: 1 },
    { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;