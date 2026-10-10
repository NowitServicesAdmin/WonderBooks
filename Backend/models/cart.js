import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema(
    {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
        quantity: { type: Number, default: 1, min: 1 },
        printOptions: {
            cover: { type: String, default: "soft" },
            pages: { type: String, default: "normal" },
            size: { type: String, default: "a5" },
        },
        addedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const CartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        items: { type: [CartItemSchema], default: [] },
    },
    { timestamps: true }
);

export default mongoose.model("Cart", CartSchema);