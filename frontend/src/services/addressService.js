import api from "../api/axios";

export const getAddresses = () => api.get("/addresses");

export const addAddress = (payload) => api.post("/addresses", payload);

export const updateAddress = (id, payload) => api.put(`/addresses/${id}`, payload);

export const deleteAddress = (id) => api.delete(`/addresses/${id}`);

export const setDefaultAddress = (id) => api.patch(`/addresses/${id}/default`);