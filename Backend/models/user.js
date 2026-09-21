import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: "",
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otpHash: {
            type: String,
            select: false,
        },
        otpExpiresAt: {
            type: Date,
            select: false,
        },
        otpAttempts: {
            type: Number,
            default: 0,
            select: false,
        },
        lastOtpSentAt: {
            type: Date,
            select: false,
        },

        // -------------------------------------------------------------
        // ROLE
        // -------------------------------------------------------------
        // Only two roles exist in WonderBook today. Super admins are
        // created manually (see the note in the subscriptions setup doc) -
        // there's no public signup flow that sets this to "super admin".
        role: {
            type: String,
            enum: ["user", "super admin"],
            default: "user",
        },

        // -------------------------------------------------------------
        // SUBSCRIPTION - QUICK ACCESS FIELDS
        // -------------------------------------------------------------
        // Denormalized snapshot of the user's current Subscription doc,
        // kept in sync by subscriptionController.syncUserFromSubscription()
        // every time a subscription is created, activated, cancelled, or
        // expired. Use these for fast checks (`if (user.isSubscribed)`)
        // without an extra lookup. Full detail + payment history live on
        // the Subscription model / /api/subscriptions endpoints.
        subscriptionPlan: {
            type: String,
            default: "",
        },
        subscriptionCancelled: {
            type: Boolean,
            default: false,
        },
        subscribedOn: {
            type: Date,
            default: null,
        },
        isSubscribed: {
            type: Boolean,
            default: false,
        },
        subscriptionStatus: {
            type: String,
            enum: ["active", "expired", "cancelled", "pending", "trial", null],
            default: null,
        },
        subscriptionType: {
            type: String,
            enum: ["monthly", "yearly", null],
            default: null,
        },
        subscriptionStartDate: {
            type: Date,
            default: null,
        },
        subscriptionEndDate: {
            type: Date,
            default: null,
        },
        currentSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription",
            default: null,
        },
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
