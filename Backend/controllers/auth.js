import crypto from "node:crypto";
import { User } from "../models/user.js";
import {
    generateOtp,
    hashOtp,
    getOtpExpiry,
    canResendOtp,
    secondsUntilResendAllowed,
    sendOtpEmail,
    MAX_OTP_ATTEMPTS,
} from "../services/otpService.js";
import { signToken } from "../services/tokenService.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name || "",
    email: user.email,
    isVerified: Boolean(user.isVerified),
    role: user.role || "user",
    isSubscribed: Boolean(user.isSubscribed),
    subscriptionPlan: user.subscriptionPlan || "",
    subscriptionStatus: user.subscriptionStatus || null,
    createdAt: user.createdAt,
});

const normalizeEmail = (email) => email?.trim().toLowerCase();

const isValidOtp = (otp) => {
    return /^\d{6}$/.test(String(otp).trim());
};

const safeOtpCompare = (providedHash, storedHash) => {
    if (!providedHash || !storedHash) {
        return false;
    }

    const providedBuffer = Buffer.from(providedHash, "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (providedBuffer.length !== storedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(providedBuffer, storedBuffer);
};


export const sendOtp = async (req, res) => {
    try {
        const { email, name, mode } = req.body;

        if (!email || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required",
            });
        }

        if (!["signup", "login"].includes(mode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid authentication mode",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = name?.trim() || "";

        const user = await User.findOne({
            email: normalizedEmail,
        }).select("+lastOtpSentAt");


        if (mode === "signup" && user) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists. Please log in instead.",
                code: "EMAIL_ALREADY_REGISTERED",
            });
        }

        if (mode === "login" && !user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email. Please sign up first.",
                code: "EMAIL_NOT_REGISTERED",
            });
        }

        let currentUser = user;

        if (mode === "signup") {
            currentUser = new User({
                email: normalizedEmail,
                name: normalizedName,
                isVerified: false,
            });
        }


        if (!canResendOtp(currentUser.lastOtpSentAt)) {
            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another code",
                retryAfterSeconds: secondsUntilResendAllowed(
                    currentUser.lastOtpSentAt
                ),
            });
        }

        const otp = generateOtp();

        currentUser.otpHash = hashOtp(otp);
        currentUser.otpExpiresAt = getOtpExpiry();
        currentUser.otpAttempts = 0;
        currentUser.lastOtpSentAt = new Date();

        await currentUser.save();

        try {
            await sendOtpEmail({
                email: normalizedEmail,
                otp,
            });
        } catch (emailError) {
            console.error("OTP email error:", emailError);

            if (mode === "signup") {
                await User.findByIdAndDelete(currentUser._id);
            } else {
                currentUser.otpHash = undefined;
                currentUser.otpExpiresAt = undefined;
                currentUser.otpAttempts = 0;
                await currentUser.save();
            }

            return res.status(500).json({
                success: false,
                message: "Unable to send the verification code. Please try again",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                mode === "signup"
                    ? "Verification code sent to your email"
                    : "Login code sent to your email",
            mode,
            ...(process.env.NODE_ENV !== "production"
                ? { devOtp: otp }
                : {}),
        });
    } catch (error) {
        console.error("Send OTP error:", error);

        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists. Please log in instead.",
                code: "EMAIL_ALREADY_REGISTERED",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Something went wrong while sending the code",
        });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp, name, mode } = req.body;

        const normalizedEmail = normalizeEmail(email);
        const normalizedOtp = String(otp || "").trim();
        const normalizedName =
            typeof name === "string" ? name.trim() : "";

        // Validate email
        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Email address is required",
            });
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        // Validate OTP
        if (!isValidOtp(normalizedOtp)) {
            return res.status(400).json({
                success: false,
                message: `Please enter the ${OTP_LENGTH}-digit verification code`,
            });
        }

        // Validate authentication mode
        if (!["signup", "login"].includes(mode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid authentication mode",
            });
        }

        const user = await User.findOne({
            email: normalizedEmail,
        }).select(
            "+otpHash +otpExpiresAt +otpAttempts"
        );

        if (mode === "login" && !user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email. Please sign up first.",
                code: "EMAIL_NOT_REGISTERED",
            });
        }

        if (mode === "signup" && user?.isVerified) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists. Please log in instead.",
                code: "EMAIL_ALREADY_REGISTERED",
            });
        }

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Please request a new verification code",
            });
        }

        if (!user.otpHash || !user.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message:
                    "Your verification code is no longer valid. Please request a new one",
            });
        }

        if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
            user.otpHash = undefined;
            user.otpExpiresAt = undefined;
            user.otpAttempts = 0;

            await user.save();

            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new code",
            });
        }


        if (user.otpExpiresAt.getTime() <= Date.now()) {
            user.otpHash = undefined;
            user.otpExpiresAt = undefined;
            user.otpAttempts = 0;

            await user.save();

            return res.status(400).json({
                success: false,
                message:
                    "This verification code has expired. Please request a new one",
            });
        }

        const providedHash = hashOtp(normalizedOtp);

        const otpMatches = safeOtpCompare(
            providedHash,
            user.otpHash
        );

        if (!otpMatches) {
            user.otpAttempts += 1;

            await user.save();

            const attemptsRemaining = Math.max(
                0,
                MAX_OTP_ATTEMPTS - user.otpAttempts
            );

            if (attemptsRemaining === 0) {
                user.otpHash = undefined;
                user.otpExpiresAt = undefined;
                user.otpAttempts = 0;

                await user.save();

                return res.status(429).json({
                    success: false,
                    message:
                        "Too many incorrect attempts. Please request a new code",
                });
            }

            return res.status(400).json({
                success: false,
                message: "Incorrect verification code",
                attemptsRemaining,
            });
        }

        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        user.otpAttempts = 0;
        user.isVerified = true;

        if (
            mode === "signup" &&
            normalizedName
        ) {
            user.name = normalizedName;
        }

        await user.save();
        const token = signToken({
            userId: user._id.toString(),
        });

        return res.status(200).json({
            success: true,
            message:
                mode === "signup"
                    ? "Account created successfully"
                    : "Logged in successfully",
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error("Verify OTP error:", error);

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong while verifying the verification code",
        });
    }
};

export const getMe = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found",
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: "Please verify your email address",
            });
        }

        return res.status(200).json({
            success: true,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while loading your account",
        });
    }
};