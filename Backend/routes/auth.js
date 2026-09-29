import { Router } from "express";
import { sendOtp, verifyOtp, googleAuth, getMe } from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/google", googleAuth);
router.get("/me", requireAuth, getMe);

export default router;