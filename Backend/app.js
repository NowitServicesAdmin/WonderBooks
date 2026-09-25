import "dotenv/config";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import cors from "cors";
import connectDB from "./config.db.js";
import bookRoutes from "./routes/books.js";
import authRoutes from "./routes/auth.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import adminPlanRoutes from "./routes/adminPlans.js";
import settingsRoutes from "./routes/settings.js";
import OpenAI from "openai";

const app = express();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "WonderBook backend is running",
  });
});
const test = async () => {
  try {
    const response = await client.images.generate({
      model: "gpt-image-1-mini",
      prompt: "a simple test image of a red apple",
      size: "1024x1024"
    });
    console.log("Success! Image generated.@Prabhuva",response);
  } catch (error) {
    console.log("Failed:", error?.status, error?.message);
  }
};
// const res = await fetch(
//   `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
// );
// const data = await res.json();
// console.log(JSON.stringify(data, null, 2));

// test();

app.use("/api/auth", authRoutes);
app.use("/api/book", bookRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminPlanRoutes);
app.use("/api/settings", settingsRoutes);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`WonderBook backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();