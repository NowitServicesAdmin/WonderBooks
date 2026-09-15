import { createBook, testImagePrompts } from "../controllers/books.js";
import { Router } from "express";
const router = Router()
router.post("/create-book", createBook);
router.get('/image',testImagePrompts)

export default router;