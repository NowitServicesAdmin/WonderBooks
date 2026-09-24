import { createBook, getMyBooks, getBookById, getBookImage, testImagePrompts } from "../controllers/books.js";
import { Router } from "express";
import { uploadCharacterPhotos } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/create-book", requireAuth, uploadCharacterPhotos, createBook);
router.get("/image", testImagePrompts);

router.get("/", requireAuth, getMyBooks);
router.get("/:bookId", requireAuth, getBookById);
router.get("/:bookId/image/:index", requireAuth, getBookImage);

export default router;
