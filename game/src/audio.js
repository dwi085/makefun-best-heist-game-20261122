// All sound is synthesized with WebAudio — no audio files, no
// network. The context is created on the first key press or click,
// so the game stays silent (and error-free) until the player acts.
let ctx = null;
let alarmNodes = null;

export function ensureAudio() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  } catch (e) {
    ctx = null;
  }
}

function tone(freq, dur, type, gain, when) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + (when || 0);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain || 0.08, t0 + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch (e) {
    // Sound is garnish: never let it break the game.
  }
}

// Pocketing loot: a bright two-note chime.
export function playPickup() {
  tone(880, 0.12, 'sine', 0.09, 0);
  tone(1318, 0.18, 'sine', 0.07, 0.08);
}

// A thrown coin: a metallic clink.
export function playCoin() {
  tone(2400, 0.07, 'square', 0.04, 0);
  tone(1900, 0.09, 'square', 0.03, 0.06);
}

// A guard spots the thief: a short alert sting.
export function playAlert() {
  tone(220, 0.14, 'sawtooth', 0.07, 0);
  tone(330, 0.16, 'sawtooth', 0.06, 0.12);
}

// Clean getaway: a little rising arpeggio.
export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.11));
}

// Busted: a low falling note.
export function playLose() {
  tone(196, 0.5, 'sawtooth', 0.08, 0);
  tone(147, 0.6, 'sawtooth', 0.07, 0.18);
}

// The alarm siren: two alternating tones while the meter is full.
// Started once, stopped once; safe to call every frame.
export function setAlarmSiren(on) {
  if (!ctx) return;
  try {
    if (on && !alarmNodes) {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoAmp = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 620;
      lfo.type = 'square';
      lfo.frequency.value = 1.6;
      lfoAmp.gain.value = 180;
      lfo.connect(lfoAmp);
      lfoAmp.connect(osc.frequency);
      amp.gain.value = 0.035;
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start();
      lfo.start();
      alarmNodes = { osc, lfo, amp };
    } else if (!on && alarmNodes) {
      alarmNodes.osc.stop();
      alarmNodes.lfo.stop();
      alarmNodes = null;
    }
  } catch (e) {
    alarmNodes = null;
  }
}
