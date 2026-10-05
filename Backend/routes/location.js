import { Router } from "express";
import {
  searchPlaces,
  getPlaceDetails,
  reverseGeocode,
} from "../controllers/locationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Logged-in users only, so the Google key can't be used by strangers
router.use(requireAuth);

router.get("/search", searchPlaces);
router.get("/details/:placeId", getPlaceDetails);
router.get("/reverse", reverseGeocode);

export default router;
