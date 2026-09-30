import api from "../api/axios";

// signup: { mode: "signup", channel: "email" | "phone", email | phone }
// login : { mode: "login", identifier }   (identifier = email OR mobile number)
export const sendOtp = async (payload) => {
    const response = await api.post("/auth/send-otp", payload);
    return response.data;
};

// signup: { mode: "signup", channel, email | phone, otp }  -> { verificationToken }
// login : { mode: "login", identifier, otp }               -> { token, user }
export const verifyOtp = async (payload) => {
    const response = await api.post("/auth/verify-otp", payload);
    return response.data;
};

// { name, email, phone, emailToken, phoneToken }  -> { token, user }
export const completeSignup = async (payload) => {
    const response = await api.post("/auth/signup", payload);
    return response.data;
};

export const googleAuth = async ({ accessToken }) => {
    const response = await api.post("/auth/google", { accessToken });
    return response.data;
};

export const fetchCurrentUser = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};