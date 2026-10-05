import { Router } from "express";
import { initiateOrder, verifyOrder, getMyOrders, getOrderById, cancelOrder, getOrderQuote,} from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getMyOrders);
router.get("/quote/:bookId", getOrderQuote);
router.post("/initiate", initiateOrder);
router.post("/verify", verifyOrder);
router.get("/:orderId", getOrderById);
router.patch("/:orderId/cancel", cancelOrder);

export default router;