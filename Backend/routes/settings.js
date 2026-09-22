import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { uploadAvatarPhoto } from "../middleware/upload.js";
import {
    getProfile,
    updateProfile,
    uploadAvatar,
    requestDataExport,
    deleteAccount,
} from "../controllers/settings.js";

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.post("/profile/avatar", requireAuth, uploadAvatarPhoto, uploadAvatar);
router.post("/data-export", requireAuth, requestDataExport);
router.delete("/account", requireAuth, deleteAccount);

export default router;