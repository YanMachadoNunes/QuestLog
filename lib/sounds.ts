// Web Audio API — 8-bit RPG sound synthesis (no audio files needed)

let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function isMuted(): boolean {
  try { return localStorage.getItem("ql-muted") === "1"; } catch { return false; }
}

function tone(
  freq: number, start: number, duration: number,
  vol = 0.2, type: OscillatorType = "square",
) {
  const ac = ctx();
  if (!ac || isMuted()) return;

  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);

  gain.gain.setValueAtTime(0, ac.currentTime + start);
  gain.gain.linearRampToValueAtTime(vol, ac.currentTime + start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);

  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

// ─── SOUND EFFECTS ────────────────────────────────────────────────

/** Quest completa — arpejo C-E-G-C ascendente */
export function sfxComplete() {
  [[261.63, 0], [329.63, 0.09], [392.00, 0.18], [523.25, 0.27]].forEach(
    ([f, t]) => tone(f, t, 0.15, 0.2, "square"),
  );
}

/** Quest falhou — descida cromática triste */
export function sfxFail() {
  [[329.63, 0], [293.66, 0.13], [261.63, 0.26], [220.00, 0.39]].forEach(
    ([f, t]) => tone(f, t, 0.22, 0.14, "sawtooth"),
  );
}

/** Level up — fanfarra ascendente épica */
export function sfxLevelUp() {
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, i) => tone(f, i * 0.08, 0.2, 0.2, "square"));
  // Nota sustentada no topo
  tone(1046.50, notes.length * 0.08 + 0.06, 0.75, 0.28, "square");
}

/** Achievement desbloqueado — fanfarra curta e brilhante */
export function sfxAchievement() {
  [[392.00, 0], [440.00, 0.09], [523.25, 0.18], [659.25, 0.27]].forEach(
    ([f, t]) => tone(f, t, 0.15, 0.18, "triangle"),
  );
}

/** Boss derrotado — épico de 2 oitavas + acorde final */
export function sfxBossDefeat() {
  const notes = [130.81, 196.00, 261.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, i) => tone(f, i * 0.07, 0.22, 0.2, "square"));
  // Acorde de vitória
  [523.25, 659.25, 783.99, 1046.50].forEach((f) =>
    tone(f, notes.length * 0.07 + 0.12, 1.1, 0.18, "square"),
  );
}

/** Boss falhou — queda dramática grave */
export function sfxBossFail() {
  [[220.00, 0], [196.00, 0.14], [164.81, 0.28], [130.81, 0.42]].forEach(
    ([f, t]) => tone(f, t, 0.28, 0.18, "sawtooth"),
  );
  // Dissonância no fim
  tone(123.47, 0.56, 0.5, 0.1, "sawtooth");
}

/** Click de navegação — blip curto */
export function sfxClick() {
  tone(660, 0, 0.05, 0.08, "square");
}

// ─── MUTE TOGGLE ──────────────────────────────────────────────────

export function toggleMute(): boolean {
  const next = !isMuted();
  try { localStorage.setItem("ql-muted", next ? "1" : "0"); } catch {}
  return next;
}

export function getMuted(): boolean {
  return isMuted();
}
