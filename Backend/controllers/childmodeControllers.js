// import crypto from "node:crypto";
// import { User } from "../models/user.js";
// import { sendEmail } from "../config/mailer.js";

// const PIN_REGEX = /^\d{4,6}$/;
// const OTP_LENGTH = 6;
// const OTP_TTL_MS = 10 * 60 * 1000;
// const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
// const MAX_OTP_ATTEMPTS = 5;
// const MAX_PIN_ATTEMPTS = 5;
// const PIN_LOCK_MS = 15 * 60 * 1000;
// const RECOVERY_WINDOW_MS = 10 * 60 * 1000;

// const SELECT_SECRETS =
//     "+childModePin +childModePendingPin +childModeOtpHash +childModeOtpExpiresAt " +
//     "+childModeOtpAttempts +childModeOtpSentAt +childModePinAttempts " +
//     "+childModeLockedUntil +childModeRecoveryVerifiedUntil";

// /* ---------------------------------------------------------------
//    Helpers
// ----------------------------------------------------------------*/
// const fail = (res, status, message, extra = {}) =>
//     res.status(status).json({ success: false, message, ...extra });

// const serverError = (res, label, error, message) => {
//     console.error(`${label}:`, error);
//     return fail(res, 500, message);
// };

// // The frontend sends the PIN as `pin` (modal) or `password` (service helper).
// const readPin = (body) => String(body?.pin ?? body?.password ?? "").trim();

// const hashPin = (pin) => {
//     const salt = crypto.randomBytes(16).toString("hex");
//     const hash = crypto.scryptSync(pin, salt, 32).toString("hex");
//     return `${salt}:${hash}`;
// };

// const verifyPinHash = (pin, stored) => {
//     if (!stored || !stored.includes(":")) return false;
//     const [salt, hash] = stored.split(":");
//     const candidate = crypto.scryptSync(pin, salt, 32);
//     const expected = Buffer.from(hash, "hex");
//     return (
//         candidate.length === expected.length &&
//         crypto.timingSafeEqual(candidate, expected)
//     );
// };

// const generateOtp = () =>
//     crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");

// const hashOtp = (userId, otp) =>
//     crypto.createHash("sha256").update(`${userId}:${otp}`).digest("hex");

// const safeEqualHex = (a, b) => {
//     const bufA = Buffer.from(a, "hex");
//     const bufB = Buffer.from(b, "hex");
//     return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
// };

// const loadUser = (req) => User.findById(req.userId).select(SELECT_SECRETS);

// const hasPin = (user) => Boolean(user.childModePin);

// const clearOtp = (user) => {
//     user.childModeOtpHash = undefined;
//     user.childModeOtpExpiresAt = undefined;
//     user.childModeOtpAttempts = 0;
// };

// const lockRemainingSeconds = (user) => {
//     if (!user.childModeLockedUntil) return 0;
//     const ms = new Date(user.childModeLockedUntil).getTime() - Date.now();
//     return ms > 0 ? Math.ceil(ms / 1000) : 0;
// };

// // Sends the 429 and returns true when the PIN is locked.
// const rejectIfLocked = (user, res) => {
//     const retryAfterSeconds = lockRemainingSeconds(user);
//     if (!retryAfterSeconds) return true && false;
//     fail(res, 429, "Too many incorrect PIN attempts. Please try again later.", {
//         retryAfterSeconds,
//     });
//     return true;
// };

// // Checks a PIN with attempt counting + lockout. Returns true if correct.
// // On failure the response has already been sent.
// const checkParentPin = async (user, pin, res) => {
//     if (rejectIfLocked(user, res)) return false;

//     if (verifyPinHash(pin, user.childModePin)) {
//         if (user.childModePinAttempts) {
//             user.childModePinAttempts = 0;
//             user.childModeLockedUntil = undefined;
//             await user.save();
//         }
//         return true;
//     }

//     user.childModePinAttempts = (user.childModePinAttempts || 0) + 1;

//     if (user.childModePinAttempts >= MAX_PIN_ATTEMPTS) {
//         user.childModePinAttempts = 0;
//         user.childModeLockedUntil = new Date(Date.now() + PIN_LOCK_MS);
//         await user.save();
//         fail(res, 429, "Too many incorrect PIN attempts. Please try again later.", {
//             retryAfterSeconds: Math.ceil(PIN_LOCK_MS / 1000),
//         });
//         return false;
//     }

//     await user.save();
//     fail(res, 401, "The PIN is incorrect.");
//     return false;
// };

// // Resend cooldown. Returns true (and responds) if still cooling down.
// const rejectIfOtpCooldown = (user, res) => {
//     if (!user.childModeOtpSentAt) return false;
//     const elapsed = Date.now() - new Date(user.childModeOtpSentAt).getTime();
//     if (elapsed >= OTP_RESEND_COOLDOWN_MS) return false;
//     fail(res, 429, "Please wait before requesting another code.", {
//         retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
//     });
//     return true;
// };

// const issueOtp = async (user, purpose) => {
//     const otp = generateOtp();
//     user.childModeOtpHash = hashOtp(user._id, otp);
//     user.childModeOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
//     user.childModeOtpAttempts = 0;
//     user.childModeOtpSentAt = new Date();
//     await user.save();

//     const action =
//         purpose === "recover"
//             ? "recover your Child Mode PIN"
//             : "turn on Child Mode";

//     await sendEmail({
//         to: user.email,
//         subject: "Your WonderBooks verification code",
//         text: `Hi ${user.name || "there"},\n\nYour verification code to ${action} is ${otp}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
//         html: `
//             <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px;">
//                 <h2 style="color:#5426c7;">WonderBooks</h2>
//                 <p>Hi ${user.name || "there"},</p>
//                 <p>Your verification code to ${action} is:</p>
//                 <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#5426c7;">${otp}</p>
//                 <p style="color:#918aa5;font-size:13px;">It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
//             </div>
//         `,
//     });
// };

// // Returns { ok: true } or { ok: false, status, message }. Caller saves on success.
// const checkOtp = async (user, otp) => {
//     if (!user.childModeOtpHash || !user.childModeOtpExpiresAt) {
//         return { ok: false, status: 400, message: "Please request a verification code first." };
//     }

//     if (new Date(user.childModeOtpExpiresAt).getTime() < Date.now()) {
//         clearOtp(user);
//         await user.save();
//         return { ok: false, status: 400, message: "The code has expired. Please request a new one." };
//     }

//     if ((user.childModeOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
//         clearOtp(user);
//         await user.save();
//         return { ok: false, status: 429, message: "Too many incorrect attempts. Please request a new code." };
//     }

//     if (!safeEqualHex(hashOtp(user._id, otp), user.childModeOtpHash)) {
//         user.childModeOtpAttempts = (user.childModeOtpAttempts || 0) + 1;
//         await user.save();
//         return { ok: false, status: 400, message: "The code is invalid or has expired." };
//     }

//     return { ok: true };
// };

// const validateOtpFormat = (otp) => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp);

// /* ---------------------------------------------------------------
//    GET /  — status
// ----------------------------------------------------------------*/
// export const getChildModeStatus = async (req, res) => {
//     try {
//         const user = await loadUser(req);
//         if (!user) return fail(res, 404, "User account not found");

//         return res.status(200).json({
//             success: true,
//             enabled: Boolean(user.childMode),
//             passwordConfigured: hasPin(user),
//         });
//     } catch (error) {
//         return serverError(res, "Get child mode error", error, "Unable to load Child Mode settings.");
//     }
// };

// /* ---------------------------------------------------------------
//    SETUP (first time): PIN + email OTP
// ----------------------------------------------------------------*/
// // POST /setup/request-otp  { pin, confirmPin }
// export const requestSetupOtp = async (req, res) => {
//     try {
//         const user = await loadUser(req);
//         if (!user) return fail(res, 404, "User account not found");

//         if (hasPin(user)) {
//             return fail(res, 400, "A parent PIN already exists. Enter it to turn on Child Mode.");
//         }

//         const pin = readPin(req.body);
//         const confirmPin = String(req.body?.confirmPin ?? "").trim();

//         if (!PIN_REGEX.test(pin)) {
//             return fail(res, 400, "Enter a PIN containing 4 to 6 digits.");
//         }
//         if (pin !== confirmPin) {
//             return fail(res, 400, "The PINs do not match.");
//         }
//         if (rejectIfOtpCooldown(user, res)) return;

//         user.childModePendingPin = hashPin(pin);

//         try {
//             await issueOtp(user, "setup");
//         } catch (emailError) {
//             console.error("Child mode setup email error:", emailError);
//             return fail(res, 500, "Unable to send the verification code. Please try again.");
//         }

//         return res.status(200).json({
//             success: true,
//             message: "A verification code has been sent to your email.",
//         });
//     } catch (error) {
//         return serverError(res, "Request setup OTP error", error, "Unable to send the verification code.");
//     }
// };

// // POST /setup  { otp }  — verifies OTP, stores PIN, enables child mode
// export const setupChildMode = async (req, res) => {
//     try {
//         const user = await loadUser(req);
//         if (!user) return fail(res, 404, "User account not found");

//         const otp = String(req.body?.otp ?? "").trim();
//         if (!validateOtpFormat(otp)) {
//             return fail(res, 400, "Enter the complete 6-digit verification code.");
//         }

//         if (!user.childModePendingPin) {
//             return fail(res, 400, "Please start the setup again.");
//         }

//         const result = await checkOtp(user, otp);
//         if (!result.ok) return fail(res, result.status, result.message);

//         user.childModePin = user.childModePendingPin;
//         user.childModePendingPin = undefined;
//         user.childMode = true;
//         user.childModePinAttempts = 0;
//         user.childModeLockedUntil = undefined;
//         clearOtp(user);
//         await user.save();

//         return res.status(200).json({
//             success: true,
//             enabled: true,
//             passwordConfigured: true,
//             message: "Child Mode has been enabled.",
//         });
//     } catch (error) {
//         return serverError(res, "Setup child mode error", error, "Unable to enable Child Mode.");
//     }
// };

// /* ---------------------------------------------------------------
//    ENABLE (PIN already set)  POST /enable  { pin }
// ----------------------------------------------------------------*/
// export const enableChildMode = async (req, res) => {
//     try {
//         const user = await loadUser(req);
//         if (!user) return fail(res, 404, "User account not found");

//         if (!hasPin(user)) {
//             return fail(res, 400, "Set up a parent PIN first.");
//         }

//         const pin = readPin(req.body);
//         if (!PIN_REGEX.test(pin)) {
//             return fail(res, 400, "Enter your 4 to 6 digit parent PIN.");
//         }

//         if (!(await checkParentPin(user, pin, res))) return;

//         user.childMode = true;
//         await user.save();

//         return res.status(200).json({
//             success: true,
//             enabled: true,
//             passwordConfigured: true,
//             message: "Child Mode has been turned on.",
//         });
//     } catch (error) {
//         return serverError(res, "Enable child mode error", error, "Unable to turn on Child Mode.");
//     }
// };

// /* ---------------------------------------------------------------
//    DISABLE  POST /disable  { pin | password }
// ----------------------------------------------------------------*/
// export const disableChildMode = async (req, res) => {
//     try {
//         const user = await loadUser(req);
//         if (!user) return fail(res, 404, "User account not found");

//         if (!hasPin(user)) {
//             return fail(res, 400, "Child Mode has not been set up.");
//         }

//         const pin = readPin(req.body);
//         if (!PIN_REGEX.test(pin)) {
//             return fail(res, 400, "Enter your 4 to 6 digit parent PIN.");
//         }

//         if (!(await checkParentPin(user, pin, res))) return;

//         user.childMode = false;
//         await user.save();

//         return res.status(200).json({
//             success: true,
//             enabled: false,
//             passwordConfigured: true,
//             message: "Child Mode has been turned off.",
//         });
//     } catch (error) {
//         return serverError(res, "Disable child mode error", error, "Unable to turn off Child Mode.");
//     }
// };

// /* ---------------------------------------------------------------
//    RECOVER (forgot PIN): email OTP -> verify -> set new PIN
// ----------------------------------------------------------------*/
// // POST /recover/request-otp
// export const requestRecoveryOtp = async (req, res) => {
//     try {
//         const user = await loadUser(req);
//         if (!user) return fail(res, 404, "User account not found");

//         if (!hasPin(user)) {
//             return fail(res, 400, "Child Mode has not been set up.");
//         }
//         if (rejectIfOtpCooldown(user, res)) return;

//         try {
//             await issueOtp(user, "recover");
//         } catch (emailError) {
//             console.error("Child mode recovery email error:", emailError);
//             return fail(res, 500, "Unable to send the recovery code.");
//         }

//         return res.status(200).json({
//             success: true,
//             message: "A recovery code has been sent to your email.",
//         });
//     } catch (error) {
//         return serverError(res, "Request recovery OTP error", error, "Unable to send the recovery code.");
//     }
// };

// // POST /recover/verify-otp  { otp }
// export const verifyRecoveryOtp = async (req, res) => {
//     try {
//         const user = await loadUser(req);
//         if (!user) return fail(res, 404, "User account not found");

//         if (!hasPin(user)) {
//             return fail(res, 400, "Child Mode has not been set up.");
//         }

//         const otp = String(req.body?.otp ?? "").trim();
//         if (!validateOtpFormat(otp)) {
//             return fail(res, 400, "Enter the complete 6-digit verification code.");
//         }

//         const result = await checkOtp(user, otp);
//         if (!result.ok) return fail(res, result.status, result.message);

//         clearOtp(user);
//         user.childModeRecoveryVerifiedUntil = new Date(Date.now() + RECOVERY_WINDOW_MS);
//         await user.save();

//         return res.status(200).json({
//             success: true,
//             message: "Email verified. You can now set a new PIN.",
//         });
//     } catch (error) {
//         return serverError(res, "Verify recovery OTP error", error, "Unable to verify the recovery code.");
//     }
// };

// // POST /recover/reset  { pin | password }
// export const resetChildModePin = async (req, res) => {
//     try {
//         const user = await loadUser(req);
//         if (!user) return fail(res, 404, "User account not found");

//         const verifiedUntil = user.childModeRecoveryVerifiedUntil
//             ? new Date(user.childModeRecoveryVerifiedUntil).getTime()
//             : 0;

//         if (verifiedUntil < Date.now()) {
//             return fail(res, 403, "Please verify your email again before setting a new PIN.");
//         }

//         const pin = readPin(req.body);
//         if (!PIN_REGEX.test(pin)) {
//             return fail(res, 400, "Enter a PIN containing 4 to 6 digits.");
//         }

//         const confirm = req.body?.confirmPin ?? req.body?.confirmPassword;
//         if (confirm !== undefined && String(confirm).trim() !== pin) {
//             return fail(res, 400, "The PINs do not match.");
//         }

//         user.childModePin = hashPin(pin);
//         user.childModePinAttempts = 0;
//         user.childModeLockedUntil = undefined;
//         user.childModeRecoveryVerifiedUntil = undefined;
//         clearOtp(user);
//         await user.save();

//         return res.status(200).json({
//             success: true,
//             enabled: Boolean(user.childMode),
//             passwordConfigured: true,
//             message: "PIN updated successfully.",
//         });
//     } catch (error) {
//         return serverError(res, "Reset child mode PIN error", error, "Unable to update the PIN.");
//     }
// };

import crypto from "node:crypto";
import { User } from "../models/user.js";
import { sendEmail } from "../config/mailer.js";

const PIN_REGEX = /^\d{4,6}$/;
const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;
const RECOVERY_WINDOW_MS = 10 * 60 * 1000;

const SELECT_SECRETS =
    "+childModePin +childModePendingPin +childModeOtpHash +childModeOtpExpiresAt " +
    "+childModeOtpAttempts +childModeOtpSentAt +childModePinAttempts " +
    "+childModeLockedUntil +childModeRecoveryVerifiedUntil";

/* ---------------------------------------------------------------
   Helpers
----------------------------------------------------------------*/
const fail = (res, status, message, extra = {}) =>
    res.status(status).json({ success: false, message, ...extra });

const serverError = (res, label, error, message) => {
    console.error(`${label}:`, error);
    return fail(res, 500, message);
};

// The frontend sends the PIN as `pin` (modal) or `password` (service helper).
const readPin = (body) => String(body?.pin ?? body?.password ?? "").trim();

const hashPin = (pin) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(pin, salt, 32).toString("hex");
    return `${salt}:${hash}`;
};

const verifyPinHash = (pin, stored) => {
    if (!stored || !stored.includes(":")) return false;
    const [salt, hash] = stored.split(":");
    const candidate = crypto.scryptSync(pin, salt, 32);
    const expected = Buffer.from(hash, "hex");
    return (
        candidate.length === expected.length &&
        crypto.timingSafeEqual(candidate, expected)
    );
};

const generateOtp = () =>
    crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");

const hashOtp = (userId, otp) =>
    crypto.createHash("sha256").update(`${userId}:${otp}`).digest("hex");

const safeEqualHex = (a, b) => {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const loadUser = (req) => User.findById(req.userId).select(SELECT_SECRETS);

const hasPin = (user) => Boolean(user.childModePin);

// childMode is an object: { enabled, hasPin }. These helpers are the ONLY
// place that reads or writes it, so it can never be treated as a boolean.
const isChildModeOn = (user) =>
    Boolean(user.childMode?.enabled) && hasPin(user);

const setChildModeState = (user, { enabled, pinSet }) => {
    if (enabled !== undefined) user.childMode.enabled = enabled;
    if (pinSet !== undefined) user.childMode.hasPin = pinSet;
};

const clearOtp = (user) => {
    user.childModeOtpHash = undefined;
    user.childModeOtpExpiresAt = undefined;
    user.childModeOtpAttempts = 0;
};

const lockRemainingSeconds = (user) => {
    if (!user.childModeLockedUntil) return 0;
    const ms = new Date(user.childModeLockedUntil).getTime() - Date.now();
    return ms > 0 ? Math.ceil(ms / 1000) : 0;
};

// Sends the 429 and returns true when the PIN is locked.
const rejectIfLocked = (user, res) => {
    const retryAfterSeconds = lockRemainingSeconds(user);
    if (!retryAfterSeconds) return false;
    fail(res, 429, "Too many incorrect PIN attempts. Please try again later.", {
        retryAfterSeconds,
    });
    return true;
};

// Checks a PIN with attempt counting + lockout. Returns true if correct.
// On failure the response has already been sent.
const checkParentPin = async (user, pin, res) => {
    if (rejectIfLocked(user, res)) return false;

    if (verifyPinHash(pin, user.childModePin)) {
        if (user.childModePinAttempts) {
            user.childModePinAttempts = 0;
            user.childModeLockedUntil = undefined;
            await user.save();
        }
        return true;
    }

    user.childModePinAttempts = (user.childModePinAttempts || 0) + 1;

    if (user.childModePinAttempts >= MAX_PIN_ATTEMPTS) {
        user.childModePinAttempts = 0;
        user.childModeLockedUntil = new Date(Date.now() + PIN_LOCK_MS);
        await user.save();
        fail(res, 429, "Too many incorrect PIN attempts. Please try again later.", {
            retryAfterSeconds: Math.ceil(PIN_LOCK_MS / 1000),
        });
        return false;
    }

    await user.save();
    fail(res, 401, "The PIN is incorrect.");
    return false;
};

// Resend cooldown. Returns true (and responds) if still cooling down.
const rejectIfOtpCooldown = (user, res) => {
    if (!user.childModeOtpSentAt) return false;
    const elapsed = Date.now() - new Date(user.childModeOtpSentAt).getTime();
    if (elapsed >= OTP_RESEND_COOLDOWN_MS) return false;
    fail(res, 429, "Please wait before requesting another code.", {
        retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
    });
    return true;
};

const issueOtp = async (user, purpose) => {
    const otp = generateOtp();
    user.childModeOtpHash = hashOtp(user._id, otp);
    user.childModeOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.childModeOtpAttempts = 0;
    user.childModeOtpSentAt = new Date();
    await user.save();

    const action =
        purpose === "recover"
            ? "recover your Child Mode PIN"
            : "turn on Child Mode";

    await sendEmail({
        to: user.email,
        subject: "Your WonderBooks verification code",
        text: `Hi ${user.name || "there"},\n\nYour verification code to ${action} is ${otp}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
        html: `
            <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px;">
                <h2 style="color:#5426c7;">WonderBooks</h2>
                <p>Hi ${user.name || "there"},</p>
                <p>Your verification code to ${action} is:</p>
                <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#5426c7;">${otp}</p>
                <p style="color:#918aa5;font-size:13px;">It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
            </div>
        `,
    });
};

// Returns { ok: true } or { ok: false, status, message }. Caller saves on success.
const checkOtp = async (user, otp) => {
    if (!user.childModeOtpHash || !user.childModeOtpExpiresAt) {
        return { ok: false, status: 400, message: "Please request a verification code first." };
    }

    if (new Date(user.childModeOtpExpiresAt).getTime() < Date.now()) {
        clearOtp(user);
        await user.save();
        return { ok: false, status: 400, message: "The code has expired. Please request a new one." };
    }

    if ((user.childModeOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
        clearOtp(user);
        await user.save();
        return { ok: false, status: 429, message: "Too many incorrect attempts. Please request a new code." };
    }

    if (!safeEqualHex(hashOtp(user._id, otp), user.childModeOtpHash)) {
        user.childModeOtpAttempts = (user.childModeOtpAttempts || 0) + 1;
        await user.save();
        return { ok: false, status: 400, message: "The code is invalid or has expired." };
    }

    return { ok: true };
};

const validateOtpFormat = (otp) => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp);

/* ---------------------------------------------------------------
   GET /  — status
----------------------------------------------------------------*/
export const getChildModeStatus = async (req, res) => {
    try {
        const user = await loadUser(req);
        if (!user) return fail(res, 404, "User account not found");

        return res.status(200).json({
            success: true,
            // "On" only counts when a PIN really exists.
            enabled: isChildModeOn(user),
            passwordConfigured: hasPin(user),
        });
    } catch (error) {
        return serverError(res, "Get child mode error", error, "Unable to load Child Mode settings.");
    }
};

/* ---------------------------------------------------------------
   SETUP (first time): PIN + email OTP
----------------------------------------------------------------*/
// POST /setup/request-otp  { pin, confirmPin }
export const requestSetupOtp = async (req, res) => {
    try {
        const user = await loadUser(req);
        if (!user) return fail(res, 404, "User account not found");

        if (hasPin(user)) {
            return fail(res, 400, "A parent PIN already exists. Enter it to turn on Child Mode.");
        }

        const pin = readPin(req.body);
        const confirmPin = String(req.body?.confirmPin ?? "").trim();

        if (!PIN_REGEX.test(pin)) {
            return fail(res, 400, "Enter a PIN containing 4 to 6 digits.");
        }
        if (pin !== confirmPin) {
            return fail(res, 400, "The PINs do not match.");
        }
        if (rejectIfOtpCooldown(user, res)) return;

        user.childModePendingPin = hashPin(pin);

        try {
            await issueOtp(user, "setup");
        } catch (emailError) {
            console.error("Child mode setup email error:", emailError);
            return fail(res, 500, "Unable to send the verification code. Please try again.");
        }

        return res.status(200).json({
            success: true,
            message: "A verification code has been sent to your email.",
        });
    } catch (error) {
        return serverError(res, "Request setup OTP error", error, "Unable to send the verification code.");
    }
};

// POST /setup  { otp }  — verifies OTP, stores PIN, enables child mode
export const setupChildMode = async (req, res) => {
    try {
        const user = await loadUser(req);
        if (!user) return fail(res, 404, "User account not found");

        const otp = String(req.body?.otp ?? "").trim();
        if (!validateOtpFormat(otp)) {
            return fail(res, 400, "Enter the complete 6-digit verification code.");
        }

        if (!user.childModePendingPin) {
            return fail(res, 400, "Please start the setup again.");
        }

        const result = await checkOtp(user, otp);
        if (!result.ok) return fail(res, result.status, result.message);

        user.childModePin = user.childModePendingPin;
        user.childModePendingPin = undefined;
        setChildModeState(user, { enabled: true, pinSet: true });
        user.childModePinAttempts = 0;
        user.childModeLockedUntil = undefined;
        clearOtp(user);
        await user.save();

        return res.status(200).json({
            success: true,
            enabled: true,
            passwordConfigured: true,
            message: "Child Mode has been enabled.",
        });
    } catch (error) {
        return serverError(res, "Setup child mode error", error, "Unable to enable Child Mode.");
    }
};

/* ---------------------------------------------------------------
   ENABLE (PIN already set)  POST /enable  { pin }
----------------------------------------------------------------*/
export const enableChildMode = async (req, res) => {
    try {
        const user = await loadUser(req);
        if (!user) return fail(res, 404, "User account not found");

        if (!hasPin(user)) {
            return fail(res, 400, "Child Mode has not been set up.");
        }

        const pin = readPin(req.body);
        if (!PIN_REGEX.test(pin)) {
            return fail(res, 400, "Enter your 4 to 6 digit parent PIN.");
        }

        if (!(await checkParentPin(user, pin, res))) return;

        setChildModeState(user, { enabled: true, pinSet: true });
        await user.save();

        return res.status(200).json({
            success: true,
            enabled: true,
            passwordConfigured: true,
            message: "Child Mode has been turned on.",
        });
    } catch (error) {
        return serverError(res, "Enable child mode error", error, "Unable to turn on Child Mode.");
    }
};

/* ---------------------------------------------------------------
   DISABLE  POST /disable  { pin | password }
----------------------------------------------------------------*/
export const disableChildMode = async (req, res) => {
    try {
        const user = await loadUser(req);
        if (!user) return fail(res, 404, "User account not found");

        if (!hasPin(user)) {
            return fail(res, 400, "Child Mode has not been set up.");
        }

        const pin = readPin(req.body);
        if (!PIN_REGEX.test(pin)) {
            return fail(res, 400, "Enter your 4 to 6 digit parent PIN.");
        }

        if (!(await checkParentPin(user, pin, res))) return;

        setChildModeState(user, { enabled: false });
        await user.save();

        return res.status(200).json({
            success: true,
            enabled: false,
            passwordConfigured: true,
            message: "Child Mode has been turned off.",
        });
    } catch (error) {
        return serverError(res, "Disable child mode error", error, "Unable to turn off Child Mode.");
    }
};

/* ---------------------------------------------------------------
   RECOVER (forgot PIN): email OTP -> verify -> set new PIN
----------------------------------------------------------------*/
// POST /recover/request-otp
export const requestRecoveryOtp = async (req, res) => {
    try {
        const user = await loadUser(req);
        if (!user) return fail(res, 404, "User account not found");

        if (!hasPin(user)) {
            return fail(res, 400, "Child Mode has not been set up.");
        }
        if (rejectIfOtpCooldown(user, res)) return;

        try {
            await issueOtp(user, "recover");
        } catch (emailError) {
            console.error("Child mode recovery email error:", emailError);
            return fail(res, 500, "Unable to send the recovery code.");
        }

        return res.status(200).json({
            success: true,
            message: "A recovery code has been sent to your email.",
        });
    } catch (error) {
        return serverError(res, "Request recovery OTP error", error, "Unable to send the recovery code.");
    }
};

// POST /recover/verify-otp  { otp }
export const verifyRecoveryOtp = async (req, res) => {
    try {
        const user = await loadUser(req);
        if (!user) return fail(res, 404, "User account not found");

        if (!hasPin(user)) {
            return fail(res, 400, "Child Mode has not been set up.");
        }

        const otp = String(req.body?.otp ?? "").trim();
        if (!validateOtpFormat(otp)) {
            return fail(res, 400, "Enter the complete 6-digit verification code.");
        }

        const result = await checkOtp(user, otp);
        if (!result.ok) return fail(res, result.status, result.message);

        clearOtp(user);
        user.childModeRecoveryVerifiedUntil = new Date(Date.now() + RECOVERY_WINDOW_MS);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified. You can now set a new PIN.",
        });
    } catch (error) {
        return serverError(res, "Verify recovery OTP error", error, "Unable to verify the recovery code.");
    }
};

// POST /recover/reset  { pin | password }
export const resetChildModePin = async (req, res) => {
    try {
        const user = await loadUser(req);
        if (!user) return fail(res, 404, "User account not found");

        const verifiedUntil = user.childModeRecoveryVerifiedUntil
            ? new Date(user.childModeRecoveryVerifiedUntil).getTime()
            : 0;

        if (verifiedUntil < Date.now()) {
            return fail(res, 403, "Please verify your email again before setting a new PIN.");
        }

        const pin = readPin(req.body);
        if (!PIN_REGEX.test(pin)) {
            return fail(res, 400, "Enter a PIN containing 4 to 6 digits.");
        }

        const confirm = req.body?.confirmPin ?? req.body?.confirmPassword;
        if (confirm !== undefined && String(confirm).trim() !== pin) {
            return fail(res, 400, "The PINs do not match.");
        }

        user.childModePin = hashPin(pin);
        setChildModeState(user, { pinSet: true });
        user.childModePinAttempts = 0;
        user.childModeLockedUntil = undefined;
        user.childModeRecoveryVerifiedUntil = undefined;
        clearOtp(user);
        await user.save();

        return res.status(200).json({
            success: true,
            enabled: Boolean(user.childMode?.enabled),
            passwordConfigured: true,
            message: "PIN updated successfully.",
        });
    } catch (error) {
        return serverError(res, "Reset child mode PIN error", error, "Unable to update the PIN.");
    }
};