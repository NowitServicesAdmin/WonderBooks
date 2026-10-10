import { Router } from "express";
import {
    getDashboardStats,
    getDashboardSeries,
    listUsers,
    getUserDetail,
    createUser,
    updateUser,
    setUserBlocked,
    deleteUser,
    listBooks,
    deleteBook,
    getBookDetail,
    getOrderDetail,
    listOrders,
    updateOrderStatus,
} from "../controllers/adminController.js";
import { requireAuth, attachUser, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, attachUser, requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/stats/series", getDashboardSeries);

router.get("/users", listUsers);
router.post("/users", createUser);
router.get("/users/:id", getUserDetail);
router.put("/users/:id", updateUser);
router.patch("/users/:id/block", setUserBlocked);
router.delete("/users/:id", deleteUser);

router.get("/books", listBooks);
router.get("/books/:id", getBookDetail);
router.delete("/books/:id", deleteBook);

router.get("/orders", listOrders);
router.get("/orders/:id", getOrderDetail);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
