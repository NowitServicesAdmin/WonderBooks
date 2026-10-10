import api from "../api/axios";

const BASE = "/admin";

// Dashboard
export const getDashboardStats = () => api.get(`${BASE}/stats`);
export const getDashboardSeries = (metric, month) =>
    api.get(`${BASE}/stats/series`, { params: { metric, month } });

// Users
export const getUsers = (params) => api.get(`${BASE}/users`, { params });
export const getUserDetail = (id) => api.get(`${BASE}/users/${id}`);
export const createUser = (data) => api.post(`${BASE}/users`, data);
export const updateUser = (id, data) => api.put(`${BASE}/users/${id}`, data);
export const setUserBlocked = (id, blocked) => api.patch(`${BASE}/users/${id}/block`, { blocked });
export const deleteUser = (id) => api.delete(`${BASE}/users/${id}`);

// Books
export const getBooks = (params) => api.get(`${BASE}/books`, { params });
export const getBookDetail = (id) => api.get(`${BASE}/books/${id}`);
export const deleteBook = (id) => api.delete(`${BASE}/books/${id}`);

// Orders
export const getOrders = (params) => api.get(`${BASE}/orders`, { params });
export const getOrderDetail = (id) => api.get(`${BASE}/orders/${id}`);
export const updateOrderStatus = (id, status, reason) =>
    api.patch(`${BASE}/orders/${id}/status`, { status, reason });

export const apiErrorMessage = (err, fallback = "Something went wrong") =>
    err?.response?.data?.message || fallback;
