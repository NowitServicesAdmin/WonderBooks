import api from "../api/axios";

export const getMyOrders = () => api.get("/orders");

export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

export const getOrderQuote = (bookId, quantity = 1) =>
  api.get(`/orders/quote/${bookId}`, { params: { quantity } });

export const initiateOrder = ({ bookId, addressId, quantity }) =>
  api.post("/orders/initiate", bookId ? { bookId, addressId, quantity } : { addressId });

export const verifyOrder = (data) => api.post("/orders/verify", data);

export const cancelOrder = (orderId, reason) =>
  api.patch(`/orders/${orderId}/cancel`, { reason });