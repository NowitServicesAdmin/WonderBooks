import crypto from "node:crypto";
import { User } from "../models/user.js";
import { uploadToS3, deleteFromS3 } from "../services/s3Service.js";
import { sendEmail } from "../config/mailer.js";

const ABOUT_LIMIT = 200;
const ALLOWED_LANGUAGES = ["English", "Hindi", "Telugu", "Spanish"];
const ALLOWED_AGE_GROUPS = ["3 – 5 years", "6 – 8 years", "9 – 12 years"];
const ALLOWED_CHARACTERS = [
    "Animals",
    "Princess",
    "Superhero",
    "Robot",
    "Dragons",
    "Fairy",
    "Dinosaur",
];
const ALLOWED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_NAME_LENGTH = 80;

// One data-export email per rolling 24h window, mirrors the OTP resend cooldown pattern.
const DATA_EXPORT_COOLDOWN_SECONDS = 24 * 60 * 60;

const sanitizeProfile = (user) => ({
    id: user._id,
    name: user.name || "",
    email: user.email,
    language: user.language || "English",
    ageGroup: user.ageGroup || "",
    favoriteCharacters: user.favoriteCharacters || [],
    about: user.about || "",
    avatarUrl: user.avatarUrl || null,
    isVerified: Boolean(user.isVerified),
    createdAt: user.createdAt,
});

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found",
            });
        }

        return res.status(200).json({
            success: true,
            profile: sanitizeProfile(user),
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while loading your profile",
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found",
            });
        }

        const { name, language, ageGroup, favoriteCharacters, about } = req.body;

        if (name !== undefined) {
            const trimmedName = String(name).trim();

            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty",
                });
            }

            user.name = trimmedName.slice(0, MAX_NAME_LENGTH);
        }

        if (language !== undefined) {
            if (!ALLOWED_LANGUAGES.includes(language)) {
                return res.status(400).json({
                    success: false,
                    message: "Please choose a valid language",
                });
            }

            user.language = language;
        }

        if (ageGroup !== undefined) {
            if (!ALLOWED_AGE_GROUPS.includes(ageGroup)) {
                return res.status(400).json({
                    success: false,
                    message: "Please choose a valid age group",
                });
            }

            user.ageGroup = ageGroup;
        }

        if (favoriteCharacters !== undefined) {
            const isValidSelection =
                Array.isArray(favoriteCharacters) &&
                favoriteCharacters.every((character) =>
                    ALLOWED_CHARACTERS.includes(character)
                );

            if (!isValidSelection) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid favorite characters selection",
                });
            }

            user.favoriteCharacters = favoriteCharacters;
        }

        if (about !== undefined) {
            user.about = String(about).slice(0, ABOUT_LIMIT);
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated",
            profile: sanitizeProfile(user),
        });
    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while saving your profile",
        });
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please choose an image to upload",
            });
        }

        if (!ALLOWED_AVATAR_MIME_TYPES.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Please upload a PNG, JPG or WEBP image",
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found",
            });
        }

        const extension =
            req.file.originalname?.split(".").pop()?.toLowerCase() || "jpg";
        const key = `avatars/${user._id}/${crypto.randomUUID()}.${extension}`;

        const uploaded = await uploadToS3({
            key,
            buffer: req.file.buffer,
            contentType: req.file.mimetype,
        });

        const previousKey = user.avatarStorageKey;
        const previousProvider = user.avatarStorageProvider;

        user.avatarUrl = uploaded.url;
        user.avatarStorageProvider = uploaded.provider;
        user.avatarStorageKey = uploaded.key;

        await user.save();

        if (previousKey && previousProvider === "s3") {
            // Best-effort cleanup of the old photo; failure here shouldn't fail the request.
            deleteFromS3(previousKey).catch((error) =>
                console.error("Failed to remove old avatar:", error)
            );
        }

        return res.status(200).json({
            success: true,
            message: "Profile photo updated",
            avatarUrl: user.avatarUrl,
        });
    } catch (error) {
        console.error("Upload avatar error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while uploading your photo",
        });
    }
};

export const requestDataExport = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select(
            "+lastDataExportRequestedAt"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found",
            });
        }

        if (user.lastDataExportRequestedAt) {
            const elapsedSeconds =
                (Date.now() - new Date(user.lastDataExportRequestedAt).getTime()) /
                1000;

            if (elapsedSeconds < DATA_EXPORT_COOLDOWN_SECONDS) {
                return res.status(429).json({
                    success: false,
                    message:
                        "You already requested a data export recently. Please check your email, or try again later.",
                    retryAfterSeconds: Math.max(
                        0,
                        Math.ceil(DATA_EXPORT_COOLDOWN_SECONDS - elapsedSeconds)
                    ),
                });
            }
        }

        user.lastDataExportRequestedAt = new Date();
        await user.save();

        // NOTE: books aren't linked to a user in this codebase yet — once they are,
        // pull the user's books/orders in here too so the export is complete.
        const exportPayload = {
            profile: sanitizeProfile(user),
            requestedAt: user.lastDataExportRequestedAt,
        };

        try {
            await sendEmail({
                to: user.email,
                subject: "Your WonderBooks data export",
                text: `Hi ${user.name || "there"},\n\nWe've received your request for a copy of your WonderBooks data. Here it is:\n\n${JSON.stringify(
                    exportPayload,
                    null,
                    2
                )}\n\nIf you didn't request this, please contact support.`,
                html: `
                    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
                        <h2 style="color:#5426c7;">WonderBooks</h2>
                        <p>Hi ${user.name || "there"},</p>
                        <p>We've received your request for a copy of your WonderBooks data. Here it is:</p>
                        <pre style="background:#f6f3ff;padding:16px;border-radius:8px;font-size:12px;overflow:auto;">${JSON.stringify(
                            exportPayload,
                            null,
                            2
                        )}</pre>
                        <p style="color:#918aa5;font-size:13px;">If you didn't request this, please contact support.</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error("Data export email error:", emailError);

            return res.status(500).json({
                success: false,
                message:
                    "We couldn't send your data export email. Please try again.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "We've emailed you a copy of your data",
        });
    } catch (error) {
        console.error("Request data export error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while preparing your data export",
        });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found",
            });
        }

        const { avatarStorageKey, avatarStorageProvider, email, name } = user;

        // NOTE: books aren't linked to a user in this codebase yet — once they are,
        // this should also purge the user's books and any stored files.
        await User.findByIdAndDelete(user._id);

        if (avatarStorageKey && avatarStorageProvider === "s3") {
            deleteFromS3(avatarStorageKey).catch((error) =>
                console.error("Failed to remove avatar on account deletion:", error)
            );
        }

        sendEmail({
            to: email,
            subject: "Your WonderBooks account has been deleted",
            text: `Hi ${name || "there"},\n\nYour WonderBooks account and all associated data have been permanently deleted, as requested.`,
            html: `
                <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px;">
                    <h2 style="color:#5426c7;">WonderBooks</h2>
                    <p>Hi ${name || "there"},</p>
                    <p>Your WonderBooks account and all associated data have been permanently deleted, as requested.</p>
                </div>
            `,
        }).catch((error) =>
            console.error("Account deletion email error:", error)
        );

        return res.status(200).json({
            success: true,
            message: "Your account has been permanently deleted",
        });
    } catch (error) {
        console.error("Delete account error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting your account",
        });
    }
};