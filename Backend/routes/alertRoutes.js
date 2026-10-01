import express from "express";
import { requireAuth } from "../middleware/auth.js";
 // use your existing auth middleware
import {
    getMyAlerts, getUnreadCount, markAlertRead, markAllAlertsRead,
    deleteAlert, clearMyAlerts, broadcastAlert,
} from "../controllers/alertController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getMyAlerts);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAlertsRead);
router.patch("/:alertId/read", markAlertRead);
router.post("/broadcast", broadcastAlert);
router.delete("/", clearMyAlerts);
router.delete("/:alertId", deleteAlert);

export default router;