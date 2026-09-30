import "dotenv/config";
import dns from "node:dns";
import path from "path";

import { generateAudio } from "./AudioService.js/ttsWorker.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import cors from "cors";
import connectDB from "./config.db.js";
import bookRoutes from "./routes/books.js";
import authRoutes from "./routes/auth.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import adminPlanRoutes from "./routes/adminPlans.js";
import adminRoutes from "./routes/admin.js";
import settingsRoutes from "./routes/settings.js";
import orderRoutes from "./routes/orders.js";
import { requireAuth } from "./middleware/auth.js";
import { expireOutdatedSubscriptions } from "./controllers/subscriptionController.js";
import OpenAI from "openai";
import AudioCache from "./models/AudioCache.js";

const app = express();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/audio", express.static(path.join(process.cwd(), "uploads", "audio")));

const audioMemoryCache = new Map(); // key -> Buffer
const MAX_CACHE_ENTRIES = 200;

app.post("/api/tts", requireAuth, async (req, res) => {
  try {
    const { bookId, pageId, text, voiceId } = req.body;
    if (!bookId || pageId === undefined || pageId === null || !text || !voiceId) {
      return res.status(400).json({ error: "bookId, pageId, text and voiceId are required" });
    }

    const cacheKey = `${bookId}:${pageId}:${voiceId}`;

    let audioBuffer = audioMemoryCache.get(cacheKey);
    if (!audioBuffer) {
      audioBuffer = await generateAudio({ text, voiceId });

      if (audioMemoryCache.size >= MAX_CACHE_ENTRIES) {
        audioMemoryCache.delete(audioMemoryCache.keys().next().value); // drop oldest
      }
      audioMemoryCache.set(cacheKey, audioBuffer);
    }

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
      "Cache-Control": "no-store",
    });
    res.send(audioBuffer); // sent directly, nothing left on disk
  } catch (err) {
    console.error("TTS error:", err.message);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

app.use("/audio", express.static("uploads/audio"));
app.use("/api/auth", authRoutes);
app.use("/api/book", bookRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminPlanRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/orders", orderRoutes);

const startServer = async () => {
  try {
    await connectDB();
    const runExpiry = () =>
      expireOutdatedSubscriptions()
        .then((n) => n && console.log(`Expired ${n} subscription(s)`))
        .catch((e) => console.error("Subscription expiry job failed:", e.message));
    runExpiry();
    setInterval(runExpiry, 60 * 60 * 1000).unref();

    app.listen(PORT, () => {
      console.log(`WonderBook backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();