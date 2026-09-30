import axios from "axios";

const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL,
   
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("wb_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const SESSION_INVALID_CODES = new Set([
    "NO_TOKEN",
    "TOKEN_INVALID",
    "ACCOUNT_NOT_FOUND",
]);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const code = error.response?.data?.code;

        const sessionInvalid =
            (status === 401 && SESSION_INVALID_CODES.has(code)) ||
            (status === 403 && code === "ACCOUNT_BLOCKED");

        if (sessionInvalid) {
            localStorage.removeItem("wb_token");
            localStorage.removeItem("wb_user");
            if (window.location.pathname !== "/auth") {
                window.location.href = "/auth";
            }
        }
        return Promise.reject(error);
    }
);

export default api;