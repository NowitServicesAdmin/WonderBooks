import crypto from "node:crypto";
import { User } from "../models/user.js";
import { Otp } from "../models/otp.js";
import {
    generateOtp,
    hashOtp,
    getOtpExpiry,
    canResendOtp,
    secondsUntilResendAllowed,
    sendOtpEmail,
    sendOtpSms,
    normalizePhone,
    parseIdentifier,
    MAX_OTP_ATTEMPTS,
} from "../services/otpService.js";
import {
    signToken,
    signVerificationToken,
    verifyVerificationToken,
} from "../services/tokenService.js";
import { normalizeS3Url } from "../services/s3Service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name || "",
    email: user.email,
    phone: user.phone || null,
    isPhoneVerified: Boolean(user.isPhoneVerified),
    isVerified: Boolean(user.isVerified),
    avatarUrl: normalizeS3Url(user.avatarUrl) || null,
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


const CHANNELS = {
    email: { label: "email" },
    phone: { label: "mobile number" },
};

const fail = (res, status, message, extra = {}) =>
    res.status(status).json({ success: false, message, ...extra });

// -> lowercase email / "+91XXXXXXXXXX", or null when invalid
const resolveTarget = (channel, body) => {
    if (channel === "email") {
        const email = normalizeEmail(body.email);
        return email && EMAIL_REGEX.test(email) ? email : null;
    }
    if (channel === "phone") return normalizePhone(body.phone);
    return null;
};

const sendChannelOtp = (channel, target, otp) =>
    channel === "email"
        ? sendOtpEmail({ email: target, otp })
        : sendOtpSms({ phone: target, otp });

// Works out { channel, target } for either mode (or sends the error response).
const readOtpTarget = (req, res) => {
    const { mode } = req.body;

    if (mode === "signup") {
        const channel = req.body.channel;
        if (!CHANNELS[channel]) {
            fail(res, 400, "Invalid verification channel");
            return null;
        }
        const target = resolveTarget(channel, req.body);
        if (!target) {
            fail(
                res,
                400,
                channel === "email"
                    ? "Please enter a valid email address"
                    : "Please enter a valid 10-digit mobile number"
            );
            return null;
        }
        return { mode, channel, target };
    }

    if (mode === "login") {
        const parsed = parseIdentifier(req.body.identifier ?? req.body.email);
        if (!parsed) {
            fail(res, 400, "Enter a valid email address or 10-digit mobile number");
            return null;
        }
        return { mode, channel: parsed.type, target: parsed.value };
    }

    fail(res, 400, "Invalid authentication mode");
    return null;
};

/* ------------------------------ SEND OTP ------------------------------ */
// signup: { mode: "signup", channel: "email" | "phone", email | phone }
// login : { mode: "login", identifier }

const CHANNELS = {
    email: { label: "email" },
    phone: { label: "mobile number" },
};

const fail = (res, status, message, extra = {}) =>
    res.status(status).json({ success: false, message, ...extra });

// -> lowercase email / "+91XXXXXXXXXX", or null when invalid
const resolveTarget = (channel, body) => {
    if (channel === "email") {
        const email = normalizeEmail(body.email);
        return email && EMAIL_REGEX.test(email) ? email : null;
    }
    if (channel === "phone") return normalizePhone(body.phone);
    return null;
};

const sendChannelOtp = (channel, target, otp) =>
    channel === "email"
        ? sendOtpEmail({ email: target, otp })
        : sendOtpSms({ phone: target, otp });

// Works out { channel, target } for either mode (or sends the error response).
const readOtpTarget = (req, res) => {
    const { mode } = req.body;

    if (mode === "signup") {
        const channel = req.body.channel;
        if (!CHANNELS[channel]) {
            fail(res, 400, "Invalid verification channel");
            return null;
        }
        const target = resolveTarget(channel, req.body);
        if (!target) {
            fail(
                res,
                400,
                channel === "email"
                    ? "Please enter a valid email address"
                    : "Please enter a valid 10-digit mobile number"
            );
            return null;
        }
        return { mode, channel, target };
    }

    if (mode === "login") {
        const parsed = parseIdentifier(req.body.identifier ?? req.body.email);
        if (!parsed) {
            fail(res, 400, "Enter a valid email address or 10-digit mobile number");
            return null;
        }
        return { mode, channel: parsed.type, target: parsed.value };
    }

    fail(res, 400, "Invalid authentication mode");
    return null;
};

/* ------------------------------ SEND OTP ------------------------------ */
// signup: { mode: "signup", channel: "email" | "phone", email | phone }
// login : { mode: "login", identifier }

export const sendOtp = async (req, res) => {
    try {
        const info = readOtpTarget(req, res);
        if (!info) return;
        const { mode, channel, target } = info;

        const existing = await User.findOne({ [channel]: target, isVerified: true }).select("_id");

        if (mode === "signup" && existing) {
            return fail(
                res,
                409,
                `An account with this ${CHANNELS[channel].label} already exists. Please log in instead.`,
                { code: channel === "email" ? "EMAIL_ALREADY_REGISTERED" : "PHONE_ALREADY_REGISTERED" }
            );
        }

        if (mode === "login" && !existing) {
            return fail(
                res,
                404,
                `No account found with this ${CHANNELS[channel].label}. Please sign up first.`,
                { code: "USER_NOT_REGISTERED" }
            );
        }

        const record = await Otp.findOne({ channel, target });
        if (record && !canResendOtp(record.lastSentAt)) {
            return fail(res, 429, "Please wait before requesting another code", {
                retryAfterSeconds: secondsUntilResendAllowed(record.lastSentAt),
            });
        }

        const otp = generateOtp();

        await Otp.findOneAndUpdate(
            { channel, target },
            {
                otpHash: hashOtp(otp),
                expiresAt: getOtpExpiry(channel),
                attempts: 0,
                lastSentAt: new Date(),
            },
            { upsert: true, setDefaultsOnInsert: true }
        );

        try {
            await sendChannelOtp(channel, target, otp);
        } catch (sendError) {
            console.error(`OTP ${channel} error:`, sendError);
            await Otp.deleteOne({ channel, target });
            return fail(
                res,
                502,
                channel === "email"
                    ? "We couldn't send the code to your email. Please check it and try again"
                    : "We couldn't send the code to your mobile number. Please check it and try again"
            );
        }

        return res.status(200).json({
            success: true,
            message:
                channel === "email"
                    ? "Verification code sent to your email"
                    : "Verification code sent to your mobile number",
            channel,
            ...(process.env.NODE_ENV !== "production" ? { devOtp: { [channel]: otp } } : {}),
        });
    } catch (error) {
        console.error("Send OTP error:", error);
        return fail(res, 500, "Something went wrong while sending the code");
    }
};

/* ----------------------------- VERIFY OTP ----------------------------- */
// signup: { mode: "signup", channel, email | phone, otp }  -> { verificationToken }
// login : { mode: "login", identifier, otp }               -> { token, user }

export const verifyOtp = async (req, res) => {
    try {
        const info = readOtpTarget(req, res);
        if (!info) return;
        const { mode, channel, target } = info;

        const otp = String(req.body.otp || "").trim();
        if (!isValidOtp(otp)) {
            return fail(res, 400, `Please enter the ${OTP_LENGTH}-digit verification code`);
        }

        const record = await Otp.findOne({ channel, target });

        if (!record) {
            return fail(res, 400, "This code is no longer valid. Please request a new one");
        }

        if (record.expiresAt.getTime() <= Date.now()) {
            await Otp.deleteOne({ _id: record._id });
            return fail(res, 400, "This code has expired. Please request a new one");
        }

        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await Otp.deleteOne({ _id: record._id });
            return fail(res, 429, "Too many incorrect attempts. Please request a new code");
        }

        if (!safeOtpCompare(hashOtp(otp), record.otpHash)) {
            record.attempts += 1;

            if (record.attempts >= MAX_OTP_ATTEMPTS) {
                await Otp.deleteOne({ _id: record._id });
                return fail(res, 429, "Too many incorrect attempts. Please request a new code");
            }

            await record.save();
            return fail(res, 400, "Incorrect verification code", {
                attemptsRemaining: MAX_OTP_ATTEMPTS - record.attempts,
            });
        }

        await Otp.deleteOne({ _id: record._id });

        if (mode === "signup") {
            return res.status(200).json({
                success: true,
                message: `${channel === "email" ? "Email" : "Mobile number"} verified`,
                verified: true,
                channel,
                verificationToken: signVerificationToken({ channel, target }),
            });
        }

        const user = await User.findOne({ [channel]: target, isVerified: true });

        if (!user) {
            return fail(res, 404, "No account found. Please sign up first.", {
                code: "USER_NOT_REGISTERED",
            });
        }

        const token = signToken({ userId: user._id.toString() });

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return fail(res, 500, "Something went wrong while verifying the code");
    }
};

/* --------------------------- COMPLETE SIGNUP --------------------------- */
// { name, email, phone, emailToken, phoneToken }  (both tokens come from verify-otp)

const hasVerified = (token, channel, target) => {
    try {
        const payload = verifyVerificationToken(token);
        return (
            payload.purpose === "signup-verify" &&
            payload.channel === channel &&
            payload.target === target
        );
    } catch {
        return false;
    }
};

export const completeSignup = async (req, res) => {
    try {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const email = normalizeEmail(req.body.email);
        const phone = normalizePhone(req.body.phone);

        if (!name) return fail(res, 400, "Please tell us your name");
        if (!email || !EMAIL_REGEX.test(email)) {
            return fail(res, 400, "Please enter a valid email address");
        }
        if (!phone) return fail(res, 400, "Please enter a valid 10-digit mobile number");

        if (!hasVerified(req.body.emailToken, "email", email)) {
            return fail(res, 400, "Please verify your email address first", {
                code: "EMAIL_NOT_VERIFIED",
            });
        }
        if (!hasVerified(req.body.phoneToken, "phone", phone)) {
            return fail(res, 400, "Please verify your mobile number first", {
                code: "PHONE_NOT_VERIFIED",
            });
        }

        const taken = await User.findOne({
            isVerified: true,
            $or: [{ email }, { phone }],
        }).select("email phone");

        if (taken) {
            return fail(
                res,
                409,
                taken.email === email
                    ? "An account with this email already exists. Please log in instead."
                    : "An account with this mobile number already exists. Please log in instead.",
                { code: "ALREADY_REGISTERED" }
            );
        }

        // clear any abandoned, never-verified records that would clash with the unique indexes
        await User.deleteMany({ isVerified: false, $or: [{ email }, { phone }] });

        const user = await User.create({
            name,
            email,
            phone,
            isVerified: true,
            isPhoneVerified: true,
        });

        const token = signToken({ userId: user._id.toString() });

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error("Complete signup error:", error);

        if (error?.code === 11000) {
            return fail(
                res,
                409,
                "An account with this email or mobile number already exists. Please log in instead.",
                { code: "ALREADY_REGISTERED" }
            );
        }

        return fail(res, 500, "Something went wrong while creating your account");
    }
};

export const googleAuth = async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                success: false,
                message: "Missing Google access token",
            });
        }

        let payload;
        try {
            const googleRes = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!googleRes.ok) {
                throw new Error(`Google userinfo responded with ${googleRes.status}`);
            }

            payload = await googleRes.json();
        } catch (verifyError) {
            console.error("Google token verification error:", verifyError);
            return res.status(401).json({
                success: false,
                message: "We couldn't verify that Google account. Please try again.",
            });
        }

        if (!payload?.email) {
            return res.status(400).json({
                success: false,
                message: "Your Google account has no email address to sign in with",
            });
        }

        if (!payload.email_verified) {
            return res.status(400).json({
                success: false,
                message: "Please use a Google account with a verified email address",
            });
        }

        const normalizedEmail = normalizeEmail(payload.email);

        let user = await User.findOne({ email: normalizedEmail });

        if (user?.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact support.",
                code: "ACCOUNT_BLOCKED",
            });
        }

        if (!user) {
            user = new User({
                email: normalizedEmail,
                name: payload.name || "",
                avatarUrl: payload.picture || null,
                isVerified: true,
            });
        } else if (!user.isVerified) {
            user.isVerified = true;
            // abandoned OTP signup for this email: drop its pending phone/OTP state
            user.phone = undefined;
            user.isPhoneVerified = false;
            if (!user.name && payload.name) {
                user.name = payload.name;
            }
            if (!user.avatarUrl && payload.picture) {
                user.avatarUrl = payload.picture;
            }
        }

        await user.save();

        const token = signToken({ userId: user._id.toString() });

        return res.status(200).json({
            success: true,
            message: "Signed in with Google successfully",
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error("Google auth error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while signing in with Google",
        });
    }
};

export const getMe = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                code: "NO_TOKEN",
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

        if (user?.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact support.",
                code: "ACCOUNT_BLOCKED",
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                code: "EMAIL_NOT_VERIFIED",
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