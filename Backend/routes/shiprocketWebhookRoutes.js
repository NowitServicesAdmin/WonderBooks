import { Router } from "express";
import {
  shiprocketWebhook,
} from "../controllers/shiprocketWebhookController.js";

const router = Router();

router.post(
  "/deliveryPartner",
  shiprocketWebhook
);

export default router;