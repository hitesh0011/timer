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
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const TOTAL_DURATION = Number(process.env.TOTAL_DURATION || 5400);

// MongoDB Schema
const timerSchema = new mongoose.Schema({
  totalDuration: { type: Number, default: TOTAL_DURATION },
  startTime: { type: Date, default: null },
  paused: { type: Boolean, default: true },
  pausedRemaining: { type: Number, default: TOTAL_DURATION },
});

const Timer = mongoose.model("Timer", timerSchema);

// MongoDB Connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Initialize timer
async function initTimer() {
  const timer = await Timer.findOne();
  if (!timer) await new Timer().save();
}
initTimer();

// Helper to calculate remaining time
function getRemainingTime(timer) {
  if (timer.paused) return timer.pausedRemaining ?? timer.totalDuration;
  const elapsed = Math.floor((Date.now() - timer.startTime.getTime()) / 1000);
  const remaining = timer.totalDuration - elapsed;
  return remaining > 0 ? remaining : 0;
}

// API Endpoints

// Get timer state
app.get("/api/time", async (req, res) => {
  const timer = await Timer.findOne();
  res.json({
    remaining: getRemainingTime(timer),
    paused: timer.paused,
    isOver: getRemainingTime(timer) <= 0,
  });
});

// Start timer
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

// Pause timer
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

// Reset timer
app.post("/api/reset", async (req, res) => {
  const timer = await Timer.findOne();
  timer.startTime = null;
  timer.paused = true;
  timer.pausedRemaining = timer.totalDuration;
  await timer.save();
  res.json({ success: true });
});

// SPA fallback (exclude /api)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
