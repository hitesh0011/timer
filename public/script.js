const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

let countdown = null; // interval ID

// Format seconds to HH:MM:SS
function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// Fetch timer from backend
async function fetchTime() {
    const res = await fetch('/api/time');
    return await res.json();
}

// Start interval
function startInterval() {
    stopInterval(); // clear previous
    countdown = setInterval(async () => {
        const data = await fetchTime();
        timerDisplay.textContent = formatTime(data.remaining);

        if (data.paused) statusDisplay.textContent = "⏸️ Paused";
        else if (data.isOver) {
            statusDisplay.textContent = "🏁 Contest Over!";
            timerDisplay.textContent = "00:00:00";
        } else statusDisplay.textContent = "🔥 Running...";
    }, 1000);
}

// Stop interval
function stopInterval() {
    clearInterval(countdown);
    countdown = null;
}

// Button events
startBtn.addEventListener('click', async () => {
    await fetch('/api/start', { method: 'POST' });
    startInterval();
});

pauseBtn.addEventListener('click', async () => {
    await fetch('/api/pause', { method: 'POST' });
    stopInterval();
    const data = await fetchTime();
    timerDisplay.textContent = formatTime(data.remaining);
    statusDisplay.textContent = "⏸️ Paused";
});

resetBtn.addEventListener('click', async () => {
    await fetch('/api/reset', { method: 'POST' });
    stopInterval();
    const data = await fetchTime();
    timerDisplay.textContent = formatTime(data.remaining);
    statusDisplay.textContent = "⏹️ Timer Reset";
});

// On page load, just display time (do not auto-start)
window.onload = async () => {
    const data = await fetchTime();
    timerDisplay.textContent = formatTime(data.remaining);
    statusDisplay.textContent = data.paused ? "⏸️ Paused" : "⏹️ Ready";
};
