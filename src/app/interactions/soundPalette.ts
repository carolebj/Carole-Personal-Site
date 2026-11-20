export type SoundCue = "primary" | "secondary" | "select" | "open" | "close" | "on" | "off";
type Note = { f: number; end: number; start: number; len: number; gain: number };
export const SOUND_LEVEL = 0.35;
export const soundPalette: Record<SoundCue, { notes: Note[]; noise: number; duration: number }> = {
  primary: { notes: [{ f: 275, end: 205, start: 0, len: .075, gain: .10 }], noise: .022, duration: .085 },
  secondary: { notes: [{ f: 345, end: 290, start: 0, len: .05, gain: .065 }], noise: .013, duration: .055 },
  select: { notes: [{ f: 590, end: 550, start: 0, len: .06, gain: .075 }], noise: .012, duration: .065 },
  open: { notes: [{ f: 330, end: 495, start: 0, len: .105, gain: .070 }], noise: .007, duration: .11 },
  close: { notes: [{ f: 440, end: 294, start: 0, len: .085, gain: .055 }], noise: .006, duration: .09 },
  on: { notes: [{ f: 294, end: 294, start: 0, len: .05, gain: .065 }, { f: 440, end: 440, start: .048, len: .05, gain: .065 }], noise: 0, duration: .105 },
  off: { notes: [{ f: 392, end: 392, start: 0, len: .05, gain: .060 }, { f: 262, end: 262, start: .048, len: .05, gain: .060 }], noise: 0, duration: .105 },
};

// Original synthesis from the approved listening board; no third-party samples.
export function scheduleSound(context: AudioContext, cue: SoundCue, startAt = context.currentTime) {
  const spec = soundPalette[cue], now = startAt;
  const bus = context.createGain();
  bus.gain.setValueAtTime(SOUND_LEVEL, now);
  bus.connect(context.destination);
  const nodes: AudioScheduledSourceNode[] = [];
  for (const note of spec.notes) {
    const oscillator = context.createOscillator(), gain = context.createGain(), start = now + note.start;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note.f, start);
    oscillator.frequency.exponentialRampToValueAtTime(note.end, start + note.len);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(note.gain, start + .004);
    gain.gain.exponentialRampToValueAtTime(.00001, start + note.len);
    oscillator.connect(gain); gain.connect(bus);
    oscillator.start(start); oscillator.stop(start + note.len + .004);
    nodes.push(oscillator);
  }
  if (spec.noise) {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .022), context.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 1709;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data[i] = (seed / 4294967296 * 2 - 1) * Math.exp(-i / (context.sampleRate * .004));
    }
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; filter.type = "lowpass"; filter.frequency.value = 1700; filter.Q.value = .4;
    gain.gain.value = spec.noise;
    source.connect(filter); filter.connect(gain); gain.connect(bus);
    source.start(now); source.stop(now + .023); nodes.push(source);
  }
  const timer = window.setTimeout(() => bus.disconnect(), (Math.max(0, startAt - context.currentTime) + spec.duration + .04) * 1000);
  return () => {
    window.clearTimeout(timer);
    // Immediate mute, including queued sources; no sound after disabling.
    bus.disconnect();
    for (const node of nodes) { try { node.stop(); } catch { /* already ended */ } }
  };
}
