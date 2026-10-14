import { Router } from "express";
import { sendOtp, verifyOtp, completeSignup, googleAuth, getMe ,getNotificationPreferences,updateNotificationPreferences} from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/signup", completeSignup);
router.post("/google", googleAuth);
router.get("/me", requireAuth, getMe);
router.get("/notification-preferences", requireAuth, getNotificationPreferences);
router.put("/notification-preferences", requireAuth, updateNotificationPreferences);

export default router;