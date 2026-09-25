import { createBook, getMyBooks, getBookById, getBookImage, testImagePrompts ,chatBook} from "../controllers/books.js";
import express,{ Router } from "express";
import { uploadCharacterPhotos } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.post("/create-book", requireAuth, uploadCharacterPhotos, createBook);
router.get("/image", testImagePrompts);
router.post("/chat", express.json({ limit: "1mb" }), chatBook);
router.get("/", requireAuth, getMyBooks);
router.get("/:bookId", requireAuth, getBookById);
router.get("/:bookId/image/:index", requireAuth, getBookImage);

export default router;
