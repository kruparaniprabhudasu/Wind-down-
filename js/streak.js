// js/streak.js
const STREAK_KEY    = 'winddown_streak';
const LAST_USED_KEY = 'winddown_last_used';
const BEST_KEY      = 'winddown_best';
const HISTORY_KEY   = 'winddown_history';
const TOTAL_DOTS    = 7;

function recordSleep() {
  const today   = todayStr();
  const last    = localStorage.getItem(LAST_USED_KEY);
  const streak  = parseInt(localStorage.getItem(STREAK_KEY)  || '0', 10);
  const best    = parseInt(localStorage.getItem(BEST_KEY)    || '0', 10);
  let   history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

  if (last === today) { renderStreak(); return; }

  const yesterday = prevDayStr(today);
  const newStreak = (last === yesterday) ? streak + 1 : 1;
  const newBest   = Math.max(newStreak, best);

  history.push(true);
  if (history.length > TOTAL_DOTS) history = history.slice(-TOTAL_DOTS);

  localStorage.setItem(STREAK_KEY,    String(newStreak));
  localStorage.setItem(LAST_USED_KEY, today);
  localStorage.setItem(BEST_KEY,      String(newBest));
  localStorage.setItem(HISTORY_KEY,   JSON.stringify(history));

  renderStreak();
}

function renderStreak() {
  const streak  = parseInt(localStorage.getItem(STREAK_KEY)  || '0', 10);
  const best    = parseInt(localStorage.getItem(BEST_KEY)    || '0', 10);
  let   history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

  while (history.length < TOTAL_DOTS) history.unshift(false);

  document.getElementById('streakNum').textContent  = streak;
  document.getElementById('streakBest').textContent = best;

  const container = document.getElementById('streakDots');
  container.innerHTML = '';
  history.forEach(filled => {
    const dot = document.createElement('div');
    dot.className = 'streak-dot' + (filled ? ' filled' : '');
    container.appendChild(dot);
  });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function prevDayStr(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

document.addEventListener('DOMContentLoaded', renderStreak);