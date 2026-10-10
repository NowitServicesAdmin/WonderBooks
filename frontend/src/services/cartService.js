import api from "../api/axios";

// Everything here returns the full cart: { items, totals }

export const getCart = () => api.get("/cart");

// printOptions: { cover, pages, size } chosen in the print-options modal
export const addCartItem = (bookId, quantity = 1, printOptions) =>
  api.post("/cart/items", { bookId, quantity, printOptions });

// Cover / page-finish / size choices (+ the book's base price when bookId is given)
export const getPrintOptions = (bookId) =>
  api.get("/cart/print-options", { params: bookId ? { bookId } : {} });

export const updateCartPrintOptions = (bookId, printOptions) =>
  api.patch(`/cart/items/${bookId}`, { printOptions });

export const updateCartItem = (bookId, quantity) =>
  api.patch(`/cart/items/${bookId}`, { quantity });

export const removeCartItem = (bookId) => api.delete(`/cart/items/${bookId}`);

export const clearCart = () => api.delete("/cart");