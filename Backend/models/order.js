import mongoose from "mongoose";

const ShippingAddressSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        line1: { type: String, required: true, trim: true },
        line2: { type: String, default: "", trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        country: { type: String, default: "India", trim: true },
    },
    { _id: false }
);
const OrderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
        },

        bookTitle: { type: String, required: true },
        bookCoverImageUrl: { type: String, default: null },

        orderNumber: { type: String, required: true, unique: true },

        shippingAddress: { type: ShippingAddressSchema, required: true },

        amount: { type: Number, required: true }, 
        currency: { type: String, default: "INR" },

        status: {
            type: String,
            enum: [
                "pending_payment", 
                "confirmed", 
                "printing",
                "shipped",
                "delivered",
                "cancelled",
            ],
            default: "pending_payment",
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },

        razorpayOrderId: { type: String, default: null },
        razorpayPaymentId: { type: String, default: null },
        razorpaySignature: { type: String, default: null },

        cancelledAt: { type: Date, default: null },
        cancelReason: { type: String, default: "" },
    },
    { timestamps: true }
);

OrderSchema.methods.statusStep = function () {
    const steps = { confirmed: 0, printing: 1, shipped: 2, delivered: 3 };
    if (this.status === "cancelled") return -1;
    return steps[this.status] ?? -1;
};

export default mongoose.model("Order", OrderSchema);
