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
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
