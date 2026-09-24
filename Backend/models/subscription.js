import mongoose from "mongoose";

const paymentHistorySchema = new mongoose.Schema(
    {
        orderId: { type: String, default: null }, // Razorpay order_id
        paymentId: { type: String, default: null }, // Razorpay payment_id
        signature: { type: String, default: null }, // Razorpay signature, for records

        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },

        status: {
            type: String,
            enum: ["created", "paid", "failed", "refunded"],
            default: "created",
        },

        method: { type: String, default: "" }, // card / upi / netbanking / wallet

        planName: { type: String, required: true },
        billingCycle: { type: String, enum: ["monthly", "yearly"], required: true },

        // The billing-period window this payment covers.
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },

        paidAt: { type: Date, default: null },
        notes: { type: String, default: "" },
    },
    { timestamps: true }
);

/*
  |--------------------------------------------------------------------------
  | SUBSCRIPTION SCHEMA
  |--------------------------------------------------------------------------
  | One document per user (found/updated in place on every purchase), with
  | a full paymentHistory[] trail inside it, plus subscription-level status
  | changes (upgrade / downgrade / cancel / restore) tracked on the same
  | doc. Superadmin's "user subscription history" view reads this
  | collection directly (populated with the user).
*/
const subscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        planName: {
            type: String, // Plan.planId at time of purchase
            required: true,
        },
        planDisplayName: { type: String, default: "" },

        billingCycle: {
            type: String,
            enum: ["monthly", "yearly"],
            default: "monthly",
        },

        status: {
            type: String,
            enum: ["active", "expired", "cancelled", "pending", "trial"],
            default: "pending",
            index: true,
        },

        amount: { type: Number, default: 0 }, // price charged for this cycle
        currency: { type: String, default: "INR" },

        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },

        autoRenew: { type: Boolean, default: false },

        // Cancellation is "soft": the user already paid for this period in
        // full (no refunds), so cancelling does NOT touch `status` or
        // `endDate` - access continues until endDate as normal. This flag
        // just marks that the user asked to stop, and is what the frontend
        // uses to (a) unlock the other plan buttons and (b) offer "Restore".
        // A fresh purchase always resets this to false.
        cancelRequested: { type: Boolean, default: false },
        cancelledAt: { type: Date, default: null },
        cancelReason: { type: String, default: "" },

        paymentHistory: [paymentHistorySchema],
    },
    { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, createdAt: -1 });

subscriptionSchema.methods.isCurrentlyActive = function () {
    return (
        this.status === "active" &&
        this.endDate &&
        this.endDate.getTime() > Date.now()
    );
};

subscriptionSchema.methods.isRestorable = function () {
    return this.cancelRequested === true && this.isCurrentlyActive();
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
