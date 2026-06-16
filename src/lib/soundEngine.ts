const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) {
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_e) {
    // Audio not supported, silently fail
  }
}

export const SoundEngine = {
  coinSend() {
    playTone(880, 0.15, 'sine', 0.08);
    setTimeout(() => playTone(660, 0.2, 'sine', 0.06), 100);
  },

  coinReceive() {
    playTone(523, 0.1, 'sine', 0.08);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.08), 80);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.08), 160);
  },

  tap() {
    playTone(1000, 0.05, 'sine', 0.04);
  },

  success() {
    playTone(523, 0.1, 'sine', 0.06);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.06), 120);
  },

  error() {
    playTone(200, 0.2, 'square', 0.06);
  },
};
