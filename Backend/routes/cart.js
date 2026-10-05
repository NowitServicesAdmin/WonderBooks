import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCart);
router.delete("/", clearCart);
router.post("/items", addToCart);
router.patch("/items/:bookId", updateCartItem);
router.delete("/items/:bookId", removeCartItem);

export default router;