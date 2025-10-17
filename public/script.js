const timerDisplay = document.getElementById("timer");
const statusDisplay = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

let timerInterval = null;

// Format seconds to HH:MM:SS
function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// Fetch remaining time from backend
async function fetchAndUpdate() {
  try {
    const res = await fetch("/api/time");
    const data = await res.json();
    timerDisplay.textContent = formatTime(data.remaining);

    statusDisplay.textContent = data.isOver
      ? "🏁 Contest Over!"
      : data.paused
      ? "⏸️ Paused"
      : "🔥 Running...";
  } catch (err) {
    console.error("Error fetching timer:", err);
  }
}

// Start frontend interval
function startFrontendTimer() {
  clearInterval(timerInterval);
  fetchAndUpdate();
  timerInterval = setInterval(fetchAndUpdate, 1000);
}

// Button handlers
startBtn.addEventListener("click", async () => {
  await fetch("/api/start", { method: "POST" });
  startFrontendTimer();
});

pauseBtn.addEventListener("click", async () => {
  await fetch("/api/pause", { method: "POST" });
  startFrontendTimer();
});

resetBtn.addEventListener("click", async () => {
  await fetch("/api/reset", { method: "POST" });
  startFrontendTimer();
});

// Auto-start polling on load
window.onload = startFrontendTimer;
