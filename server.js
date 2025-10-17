// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// ======== TIMER LOGIC =========

// Official contest settings (set these once)
const contestDuration = 2 * 60 * 60; // 2 hours (in seconds)
const contestStartTime = new Date("2025-10-19T10:00:00Z"); // set your official UTC start time

// API to get current contest time status
app.get("/api/time", (req, res) => {
  const now = new Date();
  const elapsed = Math.floor((now - contestStartTime) / 1000);
  const remaining = Math.max(contestDuration - elapsed, 0);
  const isOver = remaining <= 0;
  res.json({
    serverTime: now,
    startTime: contestStartTime,
    duration: contestDuration,
    remaining,
    isOver
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
