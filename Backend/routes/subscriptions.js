import { Router } from "express";
import {
    getPlans,
    getMySubscription,
    getMySubscriptionHistory,
    getMyPaymentHistory,
    initiateSubscription,
    activateSubscription,
    cancelSubscription,
    restoreSubscription,
} from "../controllers/subscriptionController.js";
import { requireAuth, attachUser } from "../middleware/auth.js";

const router = Router();

// Public catalog - shown on the pricing/subscription screen even before
// checking auth state.
router.get("/plans", getPlans);

// Everything below needs a logged-in user.
router.use(requireAuth, attachUser);

router.get("/me", getMySubscription);
router.get("/history", getMySubscriptionHistory);
router.get("/payment-history", getMyPaymentHistory);

router.post("/initiate", initiateSubscription);
router.post("/activate", activateSubscription);
router.patch("/cancel", cancelSubscription);
router.patch("/restore", restoreSubscription);

export default router;
