import { Router } from "express";

import {
  initiateOrder,
  verifyOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrderQuote,
  getShippingRatesForOrder,
} from "../controllers/orderController.js";

import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getMyOrders);

router.get(
  "/quote/:bookId",
  getOrderQuote
);

router.get(
  "/shipping-rates",
  getShippingRatesForOrder
);

router.post(
  "/initiate",
  initiateOrder
);

router.post(
  "/verify",
  verifyOrder
);

router.get(
  "/:orderId",
  getOrderById
);

router.patch(
  "/:orderId/cancel",
  cancelOrder
);

export default router;