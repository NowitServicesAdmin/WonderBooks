import { createBook, testImagePrompts,chatBook } from "../controllers/books.js";
import express,{ Router } from "express";
import { uploadCharacterPhotos } from "../middleware/upload.js";
const router = Router()
router.post("/chat", express.json({ limit: "1mb" }), chatBook);
router.post("/create-book", uploadCharacterPhotos,createBook);
router.get('/image',testImagePrompts)

export default router;