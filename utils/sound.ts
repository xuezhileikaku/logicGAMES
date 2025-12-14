// Simple synth sound effects using Web Audio API
// No external assets required

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playSound = {
  click: () => playTone(600, 'sine', 0.1, 0.05),
  pop: () => playTone(400, 'triangle', 0.1, 0.1),
  move: () => playTone(300, 'sine', 0.1, 0.1),
  eat: () => playTone(500, 'square', 0.1, 0.05),
  win: () => {
    setTimeout(() => playTone(523.25, 'sine', 0.2), 0);
    setTimeout(() => playTone(659.25, 'sine', 0.2), 200);
    setTimeout(() => playTone(783.99, 'sine', 0.4), 400);
    setTimeout(() => playTone(1046.50, 'sine', 0.6), 600);
  },
  lose: () => {
    setTimeout(() => playTone(300, 'sawtooth', 0.3), 0);
    setTimeout(() => playTone(200, 'sawtooth', 0.3), 300);
    setTimeout(() => playTone(100, 'sawtooth', 0.4), 600);
  },
  flip: () => playTone(800, 'sine', 0.05, 0.05),
  match: () => {
    playTone(880, 'sine', 0.1);
    setTimeout(() => playTone(1760, 'sine', 0.1), 100);
  }
};