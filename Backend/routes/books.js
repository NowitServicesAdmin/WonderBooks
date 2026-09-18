import { createBook, testImagePrompts } from "../controllers/books.js";
import { Router } from "express";
import { uploadCharacterPhotos } from "../middleware/upload.js";
const router = Router()
router.post("/create-book", uploadCharacterPhotos,createBook);
router.get('/image',testImagePrompts)

export default router;