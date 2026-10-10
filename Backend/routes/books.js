import { createBook, getMyBooks, acknowledgeFailures, getBookById, getBookImage, testImagePrompts ,chatBook, toggleFavorite, updatePageText, deleteBook} from "../controllers/books.js";
import express,{ Router } from "express";
import { uploadCharacterPhotos } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.post("/create-book", requireAuth, uploadCharacterPhotos, createBook);
router.get("/image", requireAuth, testImagePrompts);
router.post("/chat", requireAuth, express.json({ limit: "1mb" }), chatBook);
router.get("/", requireAuth, getMyBooks);
router.post("/failures/ack", requireAuth, express.json({ limit: "10kb" }), acknowledgeFailures);
router.patch("/:bookId/favorite", requireAuth, express.json({ limit: "10kb" }), toggleFavorite);
router.patch("/:bookId/pages/:pageId", requireAuth, express.json({ limit: "20kb" }), updatePageText);
router.get("/:bookId", requireAuth, getBookById);
router.delete("/:bookId", requireAuth, deleteBook);
router.get("/:bookId/image/:index", requireAuth, getBookImage);

export default router;