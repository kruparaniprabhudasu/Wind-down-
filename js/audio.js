// js/audio.js
// Web Audio API engine — synthesizes rain, white noise, and forest sounds

let audioCtx    = null;
let masterGain  = null;
let soundNodes  = [];          // active source nodes, so we can stop them
let currentSound = 'rain';
let currentVolume = 0.40;      // 0.0 → 1.0

/* ─── PUBLIC API ─────────────────────────────────────── */

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

/**
 * Start playing the selected ambient sound, fading in gradually.
 */
function startAudio() {
  initAudio();
  stopAudio();                        // clear any existing nodes first

  if (audioCtx.state === 'suspended') audioCtx.resume();

  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  // Fade in over 5 seconds
  masterGain.gain.linearRampToValueAtTime(
    currentVolume,
    audioCtx.currentTime + 5
  );
  masterGain.connect(audioCtx.destination);

  if (currentSound === 'rain')   buildRain(audioCtx, masterGain);
  if (currentSound === 'white')  buildWhite(audioCtx, masterGain);
  if (currentSound === 'forest') buildForest(audioCtx, masterGain);
}

/**
 * Stop all audio, fading out gracefully.
 */
function stopAudio() {
  if (!audioCtx) return;
  if (masterGain) {
    masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
  }
  // Stop nodes after fade
  const nodesToStop = [...soundNodes];
  setTimeout(() => {
    nodesToStop.forEach(n => { try { n.stop(); } catch (e) {} });
  }, 1500);
  soundNodes = [];
}

/**
 * Change volume while audio is playing.
 * @param {number} vol  0.0 → 1.0
 */
function setVolume(vol) {
  currentVolume = vol;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.3);
  }
}

/* ─── SOUND BUILDERS ─────────────────────────────────── */

/**
 * Pink-ish noise rain with occasional high drip pings.
 */
function buildRain(ctx, out) {
  // Build pink noise buffer (4-second loop)
  const bufLen = ctx.sampleRate * 4;
  const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data   = buf.getChannelData(0);

  let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
  for (let i = 0; i < bufLen; i++) {
    const wn = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + wn * 0.0555179;
    b1 = 0.99332 * b1 + wn * 0.0750759;
    b2 = 0.96900 * b2 + wn * 0.1538520;
    b3 = 0.86650 * b3 + wn * 0.3104856;
    b4 = 0.55000 * b4 + wn * 0.5329522;
    b5 = -0.7616 * b5 - wn * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + wn * 0.5362) * 0.11;
    b6 = wn * 0.115926;
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;

  const filter = ctx.createBiquadFilter();
  filter.type            = 'highpass';
  filter.frequency.value = 400;

  src.connect(filter);
  filter.connect(out);
  src.start();
  soundNodes.push(src);

  // Occasional water-drop pings
  scheduleDrips(ctx, out);
}

function scheduleDrips(ctx, out) {
  function drip() {
    // Only schedule next drip if we still have the same nodes active
    if (!soundNodes.length) return;

    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800 + Math.random() * 900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.14);
    g.gain.setValueAtTime(0.035 * Math.random(), ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    osc.connect(g);
    g.connect(out);
    osc.start();
    osc.stop(ctx.currentTime + 0.17);

    const delay = 500 + Math.random() * 2000;
    setTimeout(drip, delay);
  }
  setTimeout(drip, 800);
}

/**
 * Filtered white noise for a steady white-noise machine feel.
 */
function buildWhite(ctx, out) {
  const bufLen = ctx.sampleRate * 2;
  const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data   = buf.getChannelData(0);

  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.38;
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;

  const lpf = ctx.createBiquadFilter();
  lpf.type            = 'lowpass';
  lpf.frequency.value = 2800;

  const hpf = ctx.createBiquadFilter();
  hpf.type            = 'highpass';
  hpf.frequency.value = 180;

  src.connect(lpf);
  lpf.connect(hpf);
  hpf.connect(out);
  src.start();
  soundNodes.push(src);
}

/**
 * Forest: soft breeze (white noise) + synthesized cricket chirps.
 */
function buildForest(ctx, out) {
  // Breeze layer — quieter white noise
  const bufLen = ctx.sampleRate * 2;
  const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.18;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;

  const lpf = ctx.createBiquadFilter();
  lpf.type            = 'lowpass';
  lpf.frequency.value = 1200;

  src.connect(lpf);
  lpf.connect(out);
  src.start();
  soundNodes.push(src);

  // Cricket chirps
  scheduleCrickets(ctx, out);
}

function scheduleCrickets(ctx, out) {
  function chirp() {
    if (!soundNodes.length) return;

    const pulseDur = 0.035 + Math.random() * 0.02;
    const pulseGap = pulseDur + 0.012;
    const count    = 3 + Math.floor(Math.random() * 5);
    const baseFreq = 4000 + Math.random() * 800;

    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type          = 'square';
      osc.frequency.value = baseFreq;

      const t0 = ctx.currentTime + i * pulseGap;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.022, t0 + 0.005);
      g.gain.linearRampToValueAtTime(0,     t0 + pulseDur);

      osc.connect(g);
      g.connect(out);
      osc.start(t0);
      osc.stop(t0 + pulseDur + 0.01);
    }

    const delay = 800 + Math.random() * 2800;
    setTimeout(chirp, delay);
  }
  chirp();
}