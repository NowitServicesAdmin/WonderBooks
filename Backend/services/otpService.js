import crypto from "node:crypto";
import { sendEmail } from "../config/mailer.js";
import { sendSms } from "../config/sms.js";

const OTP_LENGTH = 6;
const EMAIL_OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
// Must match the "valid for 3 minutes" text in the DLT SMS template
const PHONE_OTP_EXPIRY_MINUTES = 3;
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const MAX_OTP_ATTEMPTS = 5;

export const generateOtp = () => {
    return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
};

export const hashOtp = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

export const getOtpExpiry = (channel = "email") => {
    const minutes = channel === "phone" ? PHONE_OTP_EXPIRY_MINUTES : EMAIL_OTP_EXPIRY_MINUTES;
    return new Date(Date.now() + minutes * 60 * 1000);
};

export const canResendOtp = (lastOtpSentAt) => {
    if (!lastOtpSentAt) return true;
    const elapsedSeconds = (Date.now() - new Date(lastOtpSentAt).getTime()) / 1000;
    return elapsedSeconds >= OTP_RESEND_COOLDOWN_SECONDS;
};

export const secondsUntilResendAllowed = (lastOtpSentAt) => {
    if (!lastOtpSentAt) return 0;
    const elapsedSeconds = (Date.now() - new Date(lastOtpSentAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds));
};

export const sendOtpEmail = async ({ email, otp }) => {
    await sendEmail({
        to: email,
        subject: "Your WonderBooks verification code",
        text: `Your WonderBooks verification code is ${otp}. It expires in ${EMAIL_OTP_EXPIRY_MINUTES} minutes.`,
        html: `
            <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px;">
                <h2 style="color:#5426c7;">WonderBooks</h2>
                <p>Your verification code is:</p>
                <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#30215c;">${otp}</p>
                <p style="color:#918aa5;font-size:13px;">This code expires in ${EMAIL_OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
            </div>
        `,
    });
};

export const sendOtpSms = async ({ phone, otp }) => {
    // MUST MATCH THE APPROVED DLT TEMPLATE EXACTLY (same text as your reference code)
    const appName = "WONAPP";
    const message =
        `Dear User, your OTP for ${appName} verification is ${otp}. ` +
        `This OTP is valid for ${PHONE_OTP_EXPIRY_MINUTES} minutes. Do not disclose it. NOWIT SERVICES`;

    await sendSms({ phone, message });
};

// ---------- phone / identifier helpers ----------

// Accepts "9876543210", "919876543210", "+91 98765 43210", "09876543210".
// Returns canonical "+91XXXXXXXXXX" or null.
export const normalizePhone = (input) => {
    if (typeof input !== "string") return null;
    let digits = input.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    if (!/^[6-9]\d{9}$/.test(digits)) return null;
    return `+91${digits}`;
};

// Login field: anything with "@" is an email, everything else is treated as a phone.
export const parseIdentifier = (identifier) => {
    const value = String(identifier || "").trim();
    if (!value) return null;

    if (value.includes("@")) {
        const email = value.toLowerCase();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { type: "email", value: email } : null;
    }

    const phone = normalizePhone(value);
    return phone ? { type: "phone", value: phone } : null;
};

export { MAX_OTP_ATTEMPTS, EMAIL_OTP_EXPIRY_MINUTES, PHONE_OTP_EXPIRY_MINUTES };