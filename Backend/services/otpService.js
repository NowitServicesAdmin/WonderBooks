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
    try {
        console.log("📧 Starting OTP email...");
        console.log("📩 Recipient:", email);
        console.log("🔐 OTP:", otp);

        const result = await sendEmail({
            to: email,
            subject: `${otp} is your WonderBooks verification code`,

            text: `
Your WonderBooks verification code is ${otp}.

This code expires in ${EMAIL_OTP_EXPIRY_MINUTES} minutes.

If you didn't request this code, you can safely ignore this email.

— The WonderBooks Team
            `.trim(),

            html: `
                <!DOCTYPE html>
                <html>
                <body style="
                    margin:0;
                    padding:40px 0;
                    background:#f7f4ff;
                    font-family:Arial,Helvetica,sans-serif;
                ">

                    <div style="
                        max-width:480px;
                        margin:auto;
                        background:#ffffff;
                        border-radius:20px;
                        overflow:hidden;
                    ">

                        <div style="
                            padding:28px;
                            text-align:center;
                            background:linear-gradient(135deg,#5426c7,#7654e8);
                        ">
                            <div style="
                                font-size:30px;
                                font-weight:bold;
                                color:#ffffff;
                            ">
                                ✨ WonderBooks
                            </div>

                            <div style="
                                margin-top:8px;
                                font-size:14px;
                                color:#eee9ff;
                            ">
                                Where every story becomes an adventure
                            </div>
                        </div>

                        <div style="
                            padding:36px 30px;
                            text-align:center;
                        ">

                            <div style="
                                font-size:30px;
                                margin-bottom:20px;
                            ">
                                🔐
                            </div>

                            <h2 style="
                                margin:0 0 12px;
                                color:#30215c;
                            ">
                                Verify your email
                            </h2>

                            <p style="
                                color:#6f6880;
                                font-size:15px;
                                line-height:1.6;
                            ">
                                Use the verification code below to continue
                                your WonderBooks journey.
                            </p>

                            <div style="
                                display:inline-block;
                                padding:16px 24px;
                                margin:20px 0;
                                border-radius:14px;
                                background:#f4f0ff;
                                border:1px solid #e2d9ff;
                            ">
                                <div style="
                                    font-size:34px;
                                    font-weight:bold;
                                    letter-spacing:8px;
                                    color:#5426c7;
                                ">
                                    ${otp}
                                </div>
                            </div>

                            <p style="
                                color:#918aa5;
                                font-size:13px;
                            ">
                                This code expires in
                                <strong>
                                    ${EMAIL_OTP_EXPIRY_MINUTES} minutes
                                </strong>.
                            </p>

                            <hr style="
                                border:0;
                                border-top:1px solid #eeeaf7;
                                margin:28px 0;
                            ">

                            <p style="
                                color:#918aa5;
                                font-size:12px;
                            ">
                                If you didn't request this verification code,
                                you can safely ignore this email.
                            </p>

                        </div>

                        <div style="
                            padding:20px;
                            text-align:center;
                            background:#faf9fd;
                        ">
                            <p style="
                                margin:0;
                                font-size:12px;
                                color:#a09aaf;
                            ">
                                Made with ✨ for little storytellers
                            </p>

                            <p style="
                                margin:6px 0 0;
                                font-size:12px;
                                color:#b0a9bb;
                            ">
                                © ${new Date().getFullYear()} WonderBooks
                            </p>
                        </div>

                    </div>

                </body>
                </html>
            `,
        });

        console.log("✅ OTP email sent successfully!");
        console.log("📨 Email provider response:", result);

        return {
            success: true,
            result,
        };

    } catch (error) {
        console.error("❌ OTP email failed!");
        console.error("Error message:", error?.message);
        console.error("Error code:", error?.code);
        console.error("Error response:", error?.response);
        console.error("Full error:", error);

        throw error;
    }
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