import api from "../api/axios";

export const getMyOrders = () => api.get("/orders");

export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

export const initiateOrder = (bookId, shippingAddress) =>
  api.post("/orders/initiate", { bookId, shippingAddress });

export const verifyOrder = (data) => api.post("/orders/verify", data);

export const cancelOrder = (orderId, reason) =>
  api.patch(`/orders/${orderId}/cancel`, { reason });
