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
        role: {
            type: String,
            enum: ["user", "super admin"],
            default: "user",
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
        language: {
            type: String,
            default: "English",
        },
        ageGroup: {
            type: String,
            default: "",
        },
        favoriteCharacters: {
            type: [String],
            default: [],
        },
        about: {
            type: String,
            trim: true,
            default: "",
            maxlength: 200,
        },
        avatarUrl: {
            type: String,
            default: null,
        },
        avatarStorageProvider: {
            type: String,
            enum: ["r2", "s3", null],
            default: null,
        },
        avatarStorageKey: {
            type: String,
            default: null,
        },
        lastDataExportRequestedAt: {
            type: Date,
            select: false,
        },
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);