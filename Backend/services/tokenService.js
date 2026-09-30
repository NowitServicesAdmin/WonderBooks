import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

// Short-lived proof that an email / mobile number was verified during signup.
// Signed with a different secret so it can never be used as a login token.
const VERIFY_SECRET = `${JWT_SECRET}:signup-verify`;

export const signVerificationToken = (payload) => {
    return jwt.sign({ ...payload, purpose: "signup-verify" }, VERIFY_SECRET, { expiresIn: "30m" });
};

export const verifyVerificationToken = (token) => {
    return jwt.verify(token, VERIFY_SECRET);
};