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