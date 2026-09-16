import "dotenv/config";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import cors from "cors";
import connectDB from "./config.db.js";
import bookRoutes from "./routes/books.js";
import authRoutes from "./routes/auth.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "WonderBook backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/book", bookRoutes);

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