import mongoose from "mongoose";

const TimerSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in seconds
  paused: { type: Boolean, default: false },
  pausedAt: { type: Date, default: null },
  elapsedWhilePaused: { type: Number, default: 0 } // seconds
});

export default mongoose.model("Timer", TimerSchema);
