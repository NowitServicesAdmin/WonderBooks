import "dotenv/config";
import dns from "node:dns";
import path from "path";
import crypto from "crypto";
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
import cartRoutes from "./routes/cart.js";
import addressRoutes from "./routes/addresses.js";
import locationRoutes from "./routes/location.js";
import { expireOutdatedSubscriptions } from "./controllers/subscriptionController.js";
import OpenAI from "openai";
import AudioCache from "./models/AudioCache.js";
import AlertRoutes from "./routes/alertRoutes.js";
import { ContactMessage } from "./models/ContactUs.js";
import { sendContactEnquiryEmail } from "./services/otpService.js";
import shiprocketWebhookRoutes from "./routes/shiprocketWebhookRoutes.js";

const app = express();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/audio", express.static(path.join(process.cwd(), "uploads", "audio")));

const audioMemoryCache = new Map(); // key -> Buffer
const MAX_CACHE_ENTRIES = 200;

// app.post("/api/tts", async (req, res) => {
//   try {
//     const { bookId, pageId, text, voiceId, language } = req.body;
//     if (!bookId || pageId === undefined || pageId === null || !text || !voiceId) {
//       return res.status(400).json({ error: "bookId, pageId, text and voiceId are required" });
//     }
//     const cacheKey = `${bookId}:${pageId}:${voiceId}:${language || "english"}`;

//     let audioBuffer = audioMemoryCache.get(cacheKey);
//     if (!audioBuffer) {
//       audioBuffer = await generateAudio({ text, voiceId, language });

//       if (audioMemoryCache.size >= MAX_CACHE_ENTRIES) {
//         audioMemoryCache.delete(audioMemoryCache.keys().next().value);
//       }
//       audioMemoryCache.set(cacheKey, audioBuffer);
//     }

//     res.set({
//       "Content-Type": "audio/mpeg",
//       "Content-Length": audioBuffer.length,
//       "Cache-Control": "no-store",
//     });
//     res.send(audioBuffer);
//   } catch (err) {
//     console.error("TTS error:", err.message, err.cause?.code || err.cause);
//     res.status(500).json({ error: "Failed to generate speech" });
//   }
// })
app.post("/api/tts/chunk", async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      bookId,
      pageId,
      chunkIndex,
      text,
      voiceId,
      language,
    } = req.body;

    // --------------------------------------------------
    // Validate request
    // --------------------------------------------------
    if (
      !bookId ||
      pageId === undefined ||
      pageId === null ||
      chunkIndex === undefined ||
      chunkIndex === null ||
      !text ||
      !voiceId
    ) {
      return res.status(400).json({
        error:
          "bookId, pageId, chunkIndex, text and voiceId are required",
      });
    }

    console.log("[TTS CHUNK] Request:", {
      bookId,
      pageId,
      chunkIndex,
      textLength: text.length,
      voiceId,
      language,
    });

    // --------------------------------------------------
    // Cache key
    // --------------------------------------------------
    const cacheKey = [
      bookId,
      pageId,
      voiceId,
      language || "english",
      chunkIndex,
      crypto.createHash("md5").update(String(text)).digest("hex").slice(0, 10),
    ].join(":");

    // --------------------------------------------------
    // Check memory cache
    // --------------------------------------------------
    const cachedAudio = audioMemoryCache.get(cacheKey);

    if (cachedAudio) {
      console.log("[TTS CHUNK] Cache HIT:", {
        chunkIndex,
        bytes: cachedAudio.length,
      });

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", cachedAudio.length);
      res.setHeader(
        "Cache-Control",
        "public, max-age=3600"
      );

      return res.end(cachedAudio);
    }

    console.log("[TTS CHUNK] Cache MISS:", {
      chunkIndex,
    });

    // --------------------------------------------------
    // Generate ONE complete audio chunk
    // --------------------------------------------------
    const audioStream = await generateAudio({
      text,
      voiceId,
      language,
    });

    if (!audioStream) {
      throw new Error("TTS engine returned no audio stream");
    }

    // --------------------------------------------------
    // Collect complete MP3
    // --------------------------------------------------
    const chunks = [];

    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }

    const completeAudio = Buffer.concat(chunks);

    if (!completeAudio.length) {
      throw new Error("Generated TTS audio is empty");
    }

    // --------------------------------------------------
    // Save to memory cache
    // --------------------------------------------------
    if (audioMemoryCache.size >= MAX_CACHE_ENTRIES) {
      const firstKey =
        audioMemoryCache.keys().next().value;

      if (firstKey) {
        audioMemoryCache.delete(firstKey);
      }
    }

    audioMemoryCache.set(
      cacheKey,
      completeAudio
    );

    const responseTime = Date.now() - startTime;

    console.log("[TTS CHUNK] Generated:", {
      chunkIndex,
      bytes: completeAudio.length,
      responseTime: `${responseTime} ms`,
    });

    // --------------------------------------------------
    // Send complete MP3
    // --------------------------------------------------
    res.setHeader(
      "Content-Type",
      "audio/mpeg"
    );

    res.setHeader(
      "Content-Length",
      completeAudio.length
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=3600"
    );

    return res.end(completeAudio);

  } catch (err) {
    console.error("[TTS CHUNK] Error:", {
      message: err.message,
      stack: err.stack,
      cause: err.cause?.code || err.cause,
    });

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to generate speech chunk",
      });
    }

    res.end();
  }
});

app.post("/api/tts", async (req, res) => {
  try {
    const {
      bookId,
      pageId,
      text,
      voiceId,
      language,
    } = req.body;

    if (
      !bookId ||
      pageId === undefined ||
      pageId === null ||
      !text ||
      !voiceId
    ) {
      return res.status(400).json({
        error: "bookId, pageId, text and voiceId are required",
      });
    }

    const textHash = crypto.createHash("md5").update(String(text)).digest("hex").slice(0, 10);
    const cacheKey = `${bookId}:${pageId}:${voiceId}:${language || "english"}:${textHash}`;

    // --------------------------------------------------
    // CACHE HIT
    // --------------------------------------------------

    const cachedAudio = audioMemoryCache.get(cacheKey);

    if (cachedAudio) {
      console.log("[TTS] CACHE HIT:", cacheKey);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", cachedAudio.length);
      res.setHeader("Cache-Control", "public, max-age=3600");

      return res.end(cachedAudio);
    }

    // --------------------------------------------------
    // CACHE MISS
    // --------------------------------------------------

    console.log("[TTS] CACHE MISS:", cacheKey);
    console.log("[TTS] Text length:", text.length);

    /*
     * generateAudio() returns the Python response body.
     *
     * IMPORTANT:
     * We still collect the complete audio here so that the
     * completed MP3 can be cached.
     */
    const audioStream = await generateAudio({
      text,
      voiceId,
      language,
    });

    if (!audioStream) {
      throw new Error("TTS engine returned no audio stream");
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    const chunks = [];

    for await (const chunk of audioStream) {
      const buffer = Buffer.from(chunk);

      chunks.push(buffer);

      /*
       * Forward the Python stream immediately to the client.
       */
      if (!res.destroyed) {
        res.write(buffer);
      }
    }

    // --------------------------------------------------
    // SAVE COMPLETE AUDIO TO CACHE
    // --------------------------------------------------

    const completeAudio = Buffer.concat(chunks);

    if (completeAudio.length > 0) {
      if (audioMemoryCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = audioMemoryCache.keys().next().value;

        if (firstKey) {
          audioMemoryCache.delete(firstKey);
        }
      }

      audioMemoryCache.set(cacheKey, completeAudio);

      console.log(
        "[TTS] Cached audio:",
        completeAudio.length,
        "bytes"
      );
    }

    if (!res.destroyed) {
      res.end();
    }

  } catch (err) {
    console.error(
      "TTS error:",
      err.message,
      err.cause?.code || err.cause
    );

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to generate speech",
      });
    }

    if (!res.destroyed) {
      res.end();
    }
  }
});
// contact us 
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, contactNo, timeZone, preferredTime, message } = req.body;
    if (!name || !email || !contactNo || !timeZone || !preferredTime || !message)
      return res.status(400).json({ message: "All fields are required." });
    await ContactMessage.create({ name, email, contactNo, timeZone, preferredTime, message });
    await sendContactEnquiryEmail({ name, email, contactNo, timeZone, preferredTime, message });
    res.status(201).json({ message: "Thanks! We'll reach out at your preferred time." });
  } catch (err) {
    console.log("Contact form submission error:", err.message);
    res.status(500).json({ message: "Server error. Please try again later." });
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
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/alerts", AlertRoutes);
app.use("/api/webhooks", shiprocketWebhookRoutes);
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