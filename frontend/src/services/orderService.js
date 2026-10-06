import api from "../api/axios";

export const getMyOrders = () => api.get("/orders");

export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

export const getOrderQuote = (bookId, quantity = 1) =>
  api.get(`/orders/quote/${bookId}`, { params: { quantity } });

// Delivery charge + estimated days + GST + final total for an address
export const getShippingQuote = ({ addressId, bookId, quantity }) =>
  api.get("/orders/shipping-rates", { params: { addressId, bookId, quantity } });

export const getOrderTracking = (orderId) => api.get(`/orders/${orderId}/tracking`);

export const initiateOrder = ({ bookId, addressId, quantity }) =>
  api.post("/orders/initiate", bookId ? { bookId, addressId, quantity } : { addressId });

export const verifyOrder = (data) => api.post("/orders/verify", data);

export const cancelOrder = (orderId, reason) =>
  api.patch(`/orders/${orderId}/cancel`, { reason });