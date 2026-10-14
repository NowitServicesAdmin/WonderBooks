// import api from "../api/axios";

// export const getProfile = async () => {
//     const response = await api.get("/settings/profile");
//     return response.data;
// };

// export const updateProfile = async (payload) => {
//     const response = await api.put("/settings/profile", payload);
//     return response.data;
// };

// export const uploadAvatar = async (file) => {
//     const formData = new FormData();
//     formData.append("avatar", file);

//     const response = await api.post("/settings/profile/avatar", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//     });
//     return response.data;
// };

// export const requestDataExport = async () => {
//     const response = await api.post("/settings/data-export");
//     return response.data;
// };

// export const deleteAccount = async () => {
//     const response = await api.delete("/settings/account");
//     return response.data;
// };

// export const getNotificationPreferences = async () => {
//     const response = await api.get("/auth/notification-preferences");
//     return response.data;
// }

// export const updateNotificationPreferences = async (preferences) => {
//     const response = await api.put("/auth/notification-preferences", preferences);
//     return response.data;
// }
// // child settings
// export const fetchChildMode = async () => {
//     const { data } = await api.get("/profile/child-mode");
//     return data;
// };

// export const setupChildMode = async (payload) => {
//     const { data } = await api.post("/profile/child-mode/setup", payload);
//     return data;
// };

// export const disableChildMode = async (password) => {
//     const { data } = await api.post("/profile/child-mode/disable", {
//         password,
//     });
//     return data;
// };

// export const recoverChildModePassword = async (payload) => {
//     const { data } = await api.post(
//         "/profile/child-mode/recover",
//         payload
//     );
//     return data;
// };

import api from "../api/axios";

export const getProfile = async () => {
    const response = await api.get("/settings/profile");
    return response.data;
};

export const updateProfile = async (payload) => {
    const response = await api.put("/settings/profile", payload);
    return response.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post("/settings/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const requestDataExport = async () => {
    const response = await api.post("/settings/data-export");
    return response.data;
};

export const deleteAccount = async () => {
    const response = await api.delete("/settings/account");
    return response.data;
};

export const getNotificationPreferences = async () => {
    const response = await api.get("/auth/notification-preferences");
    return response.data;
};

export const updateNotificationPreferences = async (preferences) => {
    const response = await api.put("/auth/notification-preferences", preferences);
    return response.data;
};

/* ---------------------------------------------------------------
   Child mode
----------------------------------------------------------------*/
const CHILD_MODE = "/profile/child-mode";

// -> { enabled, passwordConfigured }
export const fetchChildMode = async () => {
    const { data } = await api.get(CHILD_MODE);
    return data;
};

// First-time setup, step 1: { pin, confirmPin } -> emails an OTP
export const requestChildModeSetupOtp = async (payload) => {
    const { data } = await api.post(`${CHILD_MODE}/setup/request-otp`, payload);
    return data;
};

// First-time setup, step 2: { otp } -> stores the PIN and turns Child Mode on
export const setupChildMode = async (payload) => {
    const { data } = await api.post(`${CHILD_MODE}/setup`, payload);
    return data;
};

// PIN already exists: turn Child Mode on
export const enableChildMode = async (pin) => {
    const { data } = await api.post(`${CHILD_MODE}/enable`, { pin });
    return data;
};

export const disableChildMode = async (pin) => {
    const { data } = await api.post(`${CHILD_MODE}/disable`, { pin });
    return data;
};

// Forgot PIN
export const requestChildModeRecoveryOtp = async () => {
    const { data } = await api.post(`${CHILD_MODE}/recover/request-otp`);
    return data;
};

export const verifyChildModeRecoveryOtp = async (payload) => {
    const { data } = await api.post(`${CHILD_MODE}/recover/verify-otp`, payload);
    return data;
};

export const resetChildModePin = async (payload) => {
    const { data } = await api.post(`${CHILD_MODE}/recover/reset`, payload);
    return data;
};