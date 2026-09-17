import crypto from "node:crypto";
import { sendEmail } from "../config/mailer.js";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const MAX_OTP_ATTEMPTS = 5;

export const generateOtp = () => {
    const otp = crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
    return otp;
};

export const hashOtp = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

export const getOtpExpiry = () => {
    return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
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
        text: `Your WonderBooks verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
        html: `
            <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px;">
                <h2 style="color:#5426c7;">WonderBooks</h2>
                <p>Your verification code is:</p>
                <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#30215c;">${otp}</p>
                <p style="color:#918aa5;font-size:13px;">This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
            </div>
        `,
    });
};

export { MAX_OTP_ATTEMPTS };
