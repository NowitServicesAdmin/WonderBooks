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
}

export const updateNotificationPreferences = async (preferences) => {
    const response = await api.put("/auth/notification-preferences", preferences);
    return response.data;
}
// child settings
export const fetchChildMode = async () => {
    const { data } = await api.get("/profile/child-mode");
    return data;
};

export const setupChildMode = async (payload) => {
    const { data } = await api.post("/profile/child-mode/setup", payload);
    return data;
};

export const disableChildMode = async (password) => {
    const { data } = await api.post("/profile/child-mode/disable", {
        password,
    });
    return data;
};

export const recoverChildModePassword = async (payload) => {
    const { data } = await api.post(
        "/profile/child-mode/recover",
        payload
    );
    return data;
};