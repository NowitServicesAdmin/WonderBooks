import api from "../api/axios";

// Everything here returns the full cart: { items, totals }

export const getCart = () => api.get("/cart");

export const addCartItem = (bookId, quantity = 1) =>
  api.post("/cart/items", { bookId, quantity });

export const updateCartItem = (bookId, quantity) =>
  api.patch(`/cart/items/${bookId}`, { quantity });

export const removeCartItem = (bookId) => api.delete(`/cart/items/${bookId}`);

export const clearCart = () => api.delete("/cart");