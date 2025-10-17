import express from "express";
import mongoose from "mongoose";
import Timer from "./models/Timer.js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log(err));

// ======= Initialize Timer if not exists =======
async function initTimer() {
    let timer = await Timer.findOne();
    if (!timer) {
        const startTime = new Date(); // start now
        timer = new Timer({
            startTime,
            duration: 1 * 60 * 60 + 30 * 60, // 1h30m
            paused: false
        });
        await timer.save();
        console.log("✅ Timer initialized in DB");
    }
}
initTimer();

// ======= API Endpoints =======

// Get remaining time
app.get("/api/time", async (req, res) => {
    const timer = await Timer.findOne();
    if (!timer) return res.status(404).json({ error: "Timer not found" });

    let now = new Date();
    let elapsed = Math.floor((now - timer.startTime) / 1000);

    if (timer.paused && timer.pausedAt) {
        elapsed = Math.floor((timer.pausedAt - timer.startTime) / 1000);
    }

    const remaining = Math.max(timer.duration - elapsed, 0);
    const isOver = remaining <= 0;

    res.json({
        remaining,
        paused: timer.paused,
        isOver
    });
});

// Start or Resume
app.post("/api/start", async (req, res) => {
    const timer = await Timer.findOne();
    if (!timer) return res.status(404).json({ error: "Timer not found" });

    if (timer.paused) {
        // Adjust startTime based on paused duration
        const pausedDuration = Math.floor((new Date() - timer.pausedAt) / 1000);
        timer.startTime = new Date(timer.startTime.getTime() + pausedDuration * 1000);
        timer.paused = false;
        timer.pausedAt = null;
        await timer.save();
    }

    res.json({ message: "Timer started/resumed" });
});

// Pause
app.post("/api/pause", async (req, res) => {
    const timer = await Timer.findOne();
    if (!timer) return res.status(404).json({ error: "Timer not found" });

    if (!timer.paused) {
        timer.paused = true;
        timer.pausedAt = new Date();
        await timer.save();
    }

    res.json({ message: "Timer paused" });
});

// Reset
app.post("/api/reset", async (req, res) => {
    const timer = await Timer.findOne();
    if (!timer) return res.status(404).json({ error: "Timer not found" });

    timer.startTime = new Date();
    timer.paused = false;
    timer.pausedAt = null;
    await timer.save();

    res.json({ message: "Timer reset" });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
