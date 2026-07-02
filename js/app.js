// js/app.js
// Core Wind Down app logic:
//   - Clock display
//   - Time picker
//   - Phase management (nudge → dim → sound → goodnight)
//   - Goodnight screen with quote + stars
//   - Volume control
//   - Sound selector

/* ─── TIMING SETTINGS ────────────────────────────────── */
// Change these numbers to adjust when each stage triggers
// (minutes before your set sleep time)
const NUDGE_MINUTES_BEFORE = 15;  // gentle nudge appears
const DIM_MINUTES_BEFORE   = 10;  // screen starts dimming
const SOUND_MINUTES_BEFORE = 5;   // ambient sound starts

/* ─── STATE ─────────────────────────────────────────── */
let hour   = 11;
let minute = 0;
let ampm   = 'PM';

let active       = false;
let tickInterval = null;
let phase        = 'idle'; // idle | nudge | dim | sound | goodnight

/* ─── INIT ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderPicker();
  startClock();
  buildStars();
});

/* ─── CLOCK ─────────────────────────────────────────── */
function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  let h     = now.getHours();
  const m   = now.getMinutes();
  const ap  = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;

  document.getElementById('clockTime').textContent =
    pad(h) + ':' + pad(m);
  document.getElementById('clockAmpm').textContent = ap;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('dateLine').textContent =
    days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();

  if (active) checkPhase(now);
}

/* ─── TIME PICKER ───────────────────────────────────── */
function adjustTime(unit, delta) {
  if (unit === 'h') { hour   = ((hour   - 1 + delta + 12) % 12) + 1; }
  if (unit === 'm') { minute = ((minute + delta * 5) + 60) % 60; }
  renderPicker();
  if (active) updateTimeline();
}

function setAmpm(val) {
  ampm = val;
  document.getElementById('btnAM').classList.toggle('active', val === 'AM');
  document.getElementById('btnPM').classList.toggle('active', val === 'PM');
  if (active) updateTimeline();
}

function renderPicker() {
  document.getElementById('dispH').textContent = pad(hour);
  document.getElementById('dispM').textContent = pad(minute);
}

/* ─── TOGGLE ────────────────────────────────────────── */
function onToggle() {
  active = document.getElementById('mainToggle').checked;
  if (active) {
    updateTimeline();
    updateToggleSub();
    startTick();
  } else {
    stopAll();
  }
}

function updateToggleSub() {
  document.getElementById('toggleSub').textContent =
    'Active · ' + pad(hour) + ':' + pad(minute) + ' ' + ampm;
}

/* ─── TIMELINE LABELS ───────────────────────────────── */
function getSleepMinutes() {
  let h = ampm === 'PM' ? (hour % 12) + 12 : (hour % 12);
  return h * 60 + minute;
}

function updateTimeline() {
  const sm      = getSleepMinutes();
  const offsets = {
    'nudge': NUDGE_MINUTES_BEFORE,
    'dim':   DIM_MINUTES_BEFORE,
    'sound': SOUND_MINUTES_BEFORE,
    'zero':  0
  };
  for (const [key, off] of Object.entries(offsets)) {
    let mins = sm - off;
    if (mins < 0) mins += 1440;
    const elId = key === 'zero' ? 'tl-0-time' : 'tl-' + (key === 'nudge' ? '30' : key === 'dim' ? '20' : '10') + '-time';
    document.getElementById(elId).textContent = fmtMins(mins);
  }
}

function fmtMins(total) {
  const h  = Math.floor(total / 60) % 24;
  const m  = total % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const dh = h % 12 || 12;
  return pad(dh) + ':' + pad(m) + ' ' + ap;
}

/* ─── PHASE ENGINE ───────────────────────────────────── */
function checkPhase(now) {
  const cur      = now.getHours() * 60 + now.getMinutes();
  const sleep    = getSleepMinutes();
  // Minutes remaining until bedtime, handles overnight wrap
  const diffNorm = ((sleep - cur) + 1440) % 1440;

  if      (diffNorm === 0 || diffNorm > 1410)        setPhase('goodnight');
  else if (diffNorm <= SOUND_MINUTES_BEFORE)          setPhase('sound');
  else if (diffNorm <= DIM_MINUTES_BEFORE)            setPhase('dim');
  else if (diffNorm <= NUDGE_MINUTES_BEFORE)          setPhase('nudge');
  else                                                 setPhase('idle-active');
}

function setPhase(newPhase) {
  if (newPhase === phase) return;
  phase = newPhase;

  // Reset overlay + timeline highlights
  document.getElementById('dimOverlay').style.opacity = '0';
  ['tl-30','tl-20','tl-10','tl-0'].forEach(id =>
    document.getElementById(id).classList.remove('active')
  );

  switch (newPhase) {

    case 'idle-active':
      showStatus('');
      stopAudio();
      break;

    case 'nudge':
      document.getElementById('tl-30').classList.add('active');
      showStatus(NUDGE_MINUTES_BEFORE + ' min to sleep · start winding down');
      break;

    case 'dim':
      document.getElementById('tl-30').classList.add('active');
      document.getElementById('tl-20').classList.add('active');
      showStatus(DIM_MINUTES_BEFORE + ' min · screen dimming');
      document.getElementById('dimOverlay').style.opacity = '0.35';
      break;

    case 'sound':
      document.getElementById('tl-30').classList.add('active');
      document.getElementById('tl-20').classList.add('active');
      document.getElementById('tl-10').classList.add('active');
      showStatus(SOUND_MINUTES_BEFORE + ' min · drifting off …');
      document.getElementById('dimOverlay').style.opacity = '0.62';
      startAudio();
      break;

    case 'goodnight':
      document.getElementById('tl-0').classList.add('active');
      stopAudio();
      triggerGoodnight();
      break;
  }
}

/* ─── GOODNIGHT SCREEN ───────────────────────────────── */
function triggerGoodnight() {
  // Record sleep streak
  recordSleep();
  renderStreak();

  // Pick a random quote
  const q = getRandomQuote();
  document.getElementById('gnQuote').textContent  = '\u201C' + q.text + '\u201D';
  document.getElementById('gnAuthor').textContent = '— ' + q.author;

  // Show the screen
  const screen = document.getElementById('goodnightScreen');
  screen.classList.add('visible');
  screen.setAttribute('aria-hidden', 'false');
}

function resetApp() {
  const screen = document.getElementById('goodnightScreen');
  screen.classList.remove('visible');
  screen.setAttribute('aria-hidden', 'true');

  document.getElementById('dimOverlay').style.opacity = '0';
  document.getElementById('mainToggle').checked = false;

  stopAll();

  document.getElementById('toggleSub').textContent = 'Set a time to begin';
  showStatus('');
  ['tl-30','tl-20','tl-10','tl-0'].forEach(id =>
    document.getElementById(id).classList.remove('active')
  );
}

/* ─── STARS ─────────────────────────────────────────── */
function buildStars() {
  const container = document.getElementById('gnStars');
  const COUNT     = 120;
  for (let i = 0; i < COUNT; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.cssText = [
      'left:'    + Math.random() * 100  + '%',
      'top:'     + Math.random() * 100  + '%',
      '--dur:'   + (2 + Math.random() * 4) + 's',
      '--max-op:'+ (0.2 + Math.random() * 0.7),
      'animation-delay:' + Math.random() * 4 + 's',
      'width:'   + (Math.random() > 0.8 ? '3px' : '2px'),
      'height:'  + (Math.random() > 0.8 ? '3px' : '2px'),
    ].join(';');
    container.appendChild(star);
  }
}

/* ─── SOUND SELECTOR ─────────────────────────────────── */
function selectSound(s) {
  currentSound = s;
  ['rain','white','forest'].forEach(id =>
    document.getElementById('snd-' + id).classList.toggle('active', id === s)
  );
  // Restart audio if currently in sound phase
  if (phase === 'sound') {
    stopAudio();
    startAudio();
  }
}

/* ─── VOLUME ─────────────────────────────────────────── */
function onVolumeChange(val) {
  setVolume(parseFloat(val) / 100);
}

/* ─── STATUS PILL ────────────────────────────────────── */
function showStatus(msg) {
  const pill = document.getElementById('statusPill');
  if (!msg) { pill.classList.remove('show'); return; }
  pill.textContent = msg;
  pill.classList.add('show');
}

/* ─── TICK ───────────────────────────────────────────── */
function startTick() {
  clearInterval(tickInterval);
  // Check every 10 seconds
  tickInterval = setInterval(() => { if (active) checkPhase(new Date()); }, 10_000);
  checkPhase(new Date());
}

function stopAll() {
  clearInterval(tickInterval);
  tickInterval = null;
  stopAudio();
  document.getElementById('dimOverlay').style.opacity = '0';
  phase  = 'idle';
  active = false;
  showStatus('');
  ['tl-30','tl-20','tl-10','tl-0'].forEach(id =>
    document.getElementById(id).classList.remove('active')
  );
  document.getElementById('toggleSub').textContent = 'Set a time to begin';
}

/* ─── UTILS ──────────────────────────────────────────── */
function pad(n) { return String(n).padStart(2, '0'); }