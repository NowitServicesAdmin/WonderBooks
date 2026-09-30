import mongoose from "mongoose";

// One active OTP per (channel, target). Used for signup verification and login.
const otpSchema = new mongoose.Schema({
    channel: { type: String, enum: ["email", "phone"], required: true },
    target: { type: String, required: true }, // lowercase email or "+91XXXXXXXXXX"
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
});

otpSchema.index({ channel: 1, target: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Mongo auto-deletes expired codes

export const Otp = mongoose.model("Otp", otpSchema);