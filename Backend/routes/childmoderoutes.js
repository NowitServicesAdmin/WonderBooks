import express from "express";
import {
    getChildModeStatus,
    requestSetupOtp,
    setupChildMode,
    enableChildMode,
    disableChildMode,
    requestRecoveryOtp,
    verifyRecoveryOtp,
    resetChildModePin,
} from "../controllers/childmodeControllers.js";
import {requireAuth} from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth); // Apply authentication middleware to all routes

router.get("/", getChildModeStatus);

// First-time setup
router.post("/setup/request-otp", requestSetupOtp);
router.post("/setup", setupChildMode);

// PIN already exists
router.post("/enable", enableChildMode);
router.post("/disable", disableChildMode);

// Forgot PIN
router.post("/recover/request-otp", requestRecoveryOtp);
router.post("/recover/verify-otp", verifyRecoveryOtp);
router.post("/recover/reset", resetChildModePin);

export default router;