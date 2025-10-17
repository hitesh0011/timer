// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const TOTAL_DURATION = Number(process.env.TOTAL_DURATION || 5400); // default 1h30m

// MongoDB Timer Schema
const timerSchema = new mongoose.Schema({
  totalDuration: { type: Number, default: TOTAL_DURATION },
  startTime: { type: Date, default: null },
  paused: { type: Boolean, default: true },
  pausedRemaining: { type: Number, default: TOTAL_DURATION },
});

const Timer = mongoose.model("Timer", timerSchema);

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Initialize timer if not exists
async function initTimer() {
  let timer = await Timer.findOne();
  if (!timer) {
    timer = new Timer();
    await timer.save();
  }
}
initTimer();

// Helper: calculate remaining time
function getRemainingTime(timer) {
  if (timer.paused) return timer.pausedRemaining ?? timer.totalDuration;
  const elapsed = Math.floor((Date.now() - timer.startTime.getTime()) / 1000);
  const remaining = timer.totalDuration - elapsed;
  return remaining > 0 ? remaining : 0;
}

// API Endpoints

// GET remaining time
app.get("/api/time", async (req, res) => {
  const timer = await Timer.findOne();
  const remaining = getRemainingTime(timer);
  res.json({
    remaining,
    paused: timer.paused,
    isOver: remaining <= 0,
  });
});

// POST start
app.post("/api/start", async (req, res) => {
  const timer = await Timer.findOne();
  const remaining = getRemainingTime(timer);

  if (timer.paused) {
    timer.startTime = new Date(Date.now() - (timer.totalDuration - remaining) * 1000);
    timer.paused = false;
    timer.pausedRemaining = null;
    await timer.save();
  } else if (!timer.startTime) {
    timer.startTime = new Date();
    timer.paused = false;
    timer.pausedRemaining = null;
    await timer.save();
  }

  res.json({ success: true });
});

// POST pause
app.post("/api/pause", async (req, res) => {
  const timer = await Timer.findOne();
  if (!timer.paused && timer.startTime) {
    timer.pausedRemaining = getRemainingTime(timer);
    timer.startTime = null;
    timer.paused = true;
    await timer.save();
  }
  res.json({ success: true });
});

// POST reset
app.post("/api/reset", async (req, res) => {
  const timer = await Timer.findOne();
  timer.startTime = null;
  timer.paused = true;
  timer.pausedRemaining = timer.totalDuration;
  await timer.save();
  res.json({ success: true });
});

// Fallback for frontend SPA (exclude /api routes)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
