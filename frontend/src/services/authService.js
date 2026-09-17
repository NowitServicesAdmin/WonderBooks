import api from "../api/axios";

export const sendOtp = async ({ email, name, mode }) => {
    const response = await api.post("/auth/send-otp", { email, name, mode,});
    return response.data;
};

export const verifyOtp = async ({ email, otp, name, mode }) => {
    const response = await api.post("/auth/verify-otp", { email, otp, name, mode });
    return response.data;
};

export const fetchCurrentUser = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};
