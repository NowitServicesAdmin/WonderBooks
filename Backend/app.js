import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config.db.js";
import bookRoutes from "./routes/books.js"


const app = express();

connectDB();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "WonderBook backend is running",
  });
});
app.use('/api/book',bookRoutes)

app.listen(PORT, () => {
  console.log(`WonderBook backend running on http://localhost:${PORT}`);
});