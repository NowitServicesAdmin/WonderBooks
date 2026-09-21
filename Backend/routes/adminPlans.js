import { Router } from "express";
import {
    getAllPlans,
    createPlan,
    updatePlan,
    deletePlan,
    updateSettings,
    getAllSubscriptions,
    getUserSubscriptionHistory,
} from "../controllers/adminPlanController.js";
import { requireAuth, attachUser, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Everything here is super admin only - this controls live pricing and
// exposes every user's payment history.
router.use(requireAuth, attachUser, requireAdmin);

router.get("/plans", getAllPlans);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);
router.patch("/plans/settings", updateSettings);

router.get("/subscriptions", getAllSubscriptions);
router.get("/subscriptions/:userId/history", getUserSubscriptionHistory);

export default router;
