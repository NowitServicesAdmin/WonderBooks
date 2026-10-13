import api from "../api/axios";

export const getCart = () => api.get("/cart");

export const addCartItem = (bookId, quantity = 1, printOptions) =>
  api.post("/cart/items", { bookId, quantity, printOptions });

export const getPrintOptions = (bookId) =>
  api.get("/cart/print-options", { params: bookId ? { bookId } : {} });

export const updateCartPrintOptions = (bookId, printOptions, dedicationText) =>
  api.patch(`/cart/items/${bookId}`, {
    printOptions,
    ...(dedicationText !== undefined ? { dedicationText } : {}),
  });

export const updateCartGiftMessage = (giftMessage) =>
  api.patch("/cart/gift-message", { giftMessage });

export const updateCartItem = (bookId, quantity) =>
  api.patch(`/cart/items/${bookId}`, { quantity });

export const removeCartItem = (bookId) => api.delete(`/cart/items/${bookId}`);

export const clearCart = () => api.delete("/cart");