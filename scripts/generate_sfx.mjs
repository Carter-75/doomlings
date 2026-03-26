import fs from 'node:fs';
import path from 'node:path';

const SAMPLE_RATE = 44100;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function envADSR(t, attack, decay, sustain, release, length) {
  if (t < 0 || t > length) return 0;
  if (t < attack) return t / attack;
  if (t < attack + decay) {
    const d = (t - attack) / decay;
    return 1 + (sustain - 1) * d;
  }
  if (t < length - release) return sustain;
  const r = (t - (length - release)) / release;
  return sustain * (1 - r);
}

function makeBuffer(seconds) {
  return new Float32Array(Math.floor(seconds * SAMPLE_RATE));
}

function addTone(buffer, {
  start = 0,
  duration = 0.2,
  freq = 440,
  freqEnd = null,
  gain = 0.3,
  attack = 0.005,
  decay = 0.04,
  sustain = 0.6,
  release = 0.06,
  wave = 'sine'
}) {
  const startIndex = Math.floor(start * SAMPLE_RATE);
  const endIndex = Math.min(buffer.length, Math.floor((start + duration) * SAMPLE_RATE));
  const len = duration;

  for (let i = startIndex; i < endIndex; i++) {
    const t = (i - startIndex) / SAMPLE_RATE;
    const p = t / len;
    const f = freqEnd == null ? freq : freq + (freqEnd - freq) * p;
    const phase = 2 * Math.PI * f * t;
    let sample = 0;

    switch (wave) {
      case 'triangle':
        sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
        break;
      case 'square':
        sample = Math.sin(phase) >= 0 ? 1 : -1;
        break;
      case 'saw':
        sample = 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
        break;
      default:
        sample = Math.sin(phase);
    }

    const a = envADSR(t, attack, decay, sustain, release, len);
    buffer[i] += sample * a * gain;
  }
}

function addNoise(buffer, {
  start = 0,
  duration = 0.12,
  gain = 0.1,
  attack = 0.002,
  decay = 0.03,
  sustain = 0.2,
  release = 0.06,
  color = 'white'
}) {
  const startIndex = Math.floor(start * SAMPLE_RATE);
  const endIndex = Math.min(buffer.length, Math.floor((start + duration) * SAMPLE_RATE));
  const len = duration;
  let prev = 0;

  for (let i = startIndex; i < endIndex; i++) {
    const t = (i - startIndex) / SAMPLE_RATE;
    let n = Math.random() * 2 - 1;
    if (color === 'pink') {
      n = 0.985 * prev + 0.15 * n;
      prev = n;
    }
    const a = envADSR(t, attack, decay, sustain, release, len);
    buffer[i] += n * a * gain;
  }
}

function addSimpleDelay(buffer, delaySec = 0.08, feedback = 0.25) {
  const delaySamples = Math.floor(delaySec * SAMPLE_RATE);
  for (let i = delaySamples; i < buffer.length; i++) {
    buffer[i] += buffer[i - delaySamples] * feedback;
  }
}

function normalize(buffer, targetPeak = 0.9) {
  let peak = 0;
  for (const s of buffer) peak = Math.max(peak, Math.abs(s));
  if (peak < 1e-6) return buffer;
  const mul = targetPeak / peak;
  for (let i = 0; i < buffer.length; i++) buffer[i] = clamp(buffer[i] * mul, -1, 1);
  return buffer;
}

function writeWavMonoFloat32(filePath, samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = samples.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = clamp(samples[i], -1, 1);
    buffer.writeInt16LE(Math.floor(s * 32767), offset);
    offset += 2;
  }

  fs.writeFileSync(filePath, buffer);
}

function buildClick() {
  const b = makeBuffer(0.16);
  addTone(b, { start: 0, duration: 0.08, freq: 1100, freqEnd: 700, gain: 0.34, wave: 'triangle', sustain: 0.28, release: 0.04 });
  addTone(b, { start: 0, duration: 0.05, freq: 1800, freqEnd: 1200, gain: 0.1, wave: 'sine', sustain: 0.1, release: 0.03 });
  addNoise(b, { start: 0, duration: 0.03, gain: 0.04, color: 'pink', release: 0.02 });
  return normalize(b, 0.88);
}

function buildClickSoft() {
  const b = makeBuffer(0.16);
  addTone(b, { start: 0, duration: 0.082, freq: 1060, freqEnd: 690, gain: 0.32, wave: 'triangle', sustain: 0.26, release: 0.045 });
  addTone(b, { start: 0.001, duration: 0.048, freq: 1720, freqEnd: 1140, gain: 0.085, wave: 'sine', sustain: 0.1, release: 0.03 });
  addNoise(b, { start: 0, duration: 0.028, gain: 0.035, color: 'pink', release: 0.02 });
  return normalize(b, 0.88);
}

function buildClickBright() {
  const b = makeBuffer(0.16);
  addTone(b, { start: 0, duration: 0.078, freq: 1140, freqEnd: 740, gain: 0.33, wave: 'triangle', sustain: 0.25, release: 0.04 });
  addTone(b, { start: 0.002, duration: 0.05, freq: 1880, freqEnd: 1260, gain: 0.11, wave: 'sine', sustain: 0.1, release: 0.03 });
  addNoise(b, { start: 0, duration: 0.028, gain: 0.038, color: 'pink', release: 0.02 });
  return normalize(b, 0.88);
}

function buildClickDeep() {
  const b = makeBuffer(0.17);
  addTone(b, { start: 0, duration: 0.084, freq: 980, freqEnd: 650, gain: 0.33, wave: 'triangle', sustain: 0.29, release: 0.045 });
  addTone(b, { start: 0, duration: 0.052, freq: 1600, freqEnd: 1080, gain: 0.095, wave: 'sine', sustain: 0.1, release: 0.032 });
  addNoise(b, { start: 0, duration: 0.03, gain: 0.032, color: 'pink', release: 0.02 });
  return normalize(b, 0.88);
}

function buildAgeAdvance() {
  const b = makeBuffer(0.85);
  addTone(b, { start: 0.00, duration: 0.28, freq: 523.25, gain: 0.26, wave: 'sine', sustain: 0.65, release: 0.09 });
  addTone(b, { start: 0.08, duration: 0.30, freq: 659.25, gain: 0.24, wave: 'sine', sustain: 0.68, release: 0.09 });
  addTone(b, { start: 0.18, duration: 0.40, freq: 783.99, gain: 0.28, wave: 'triangle', sustain: 0.62, release: 0.16 });
  addTone(b, { start: 0.30, duration: 0.34, freq: 1046.5, gain: 0.16, wave: 'sine', sustain: 0.5, release: 0.16 });
  addSimpleDelay(b, 0.09, 0.24);
  return normalize(b, 0.9);
}

function buildAgeAdvanceWarm() {
  const b = makeBuffer(0.86);
  addTone(b, { start: 0.00, duration: 0.29, freq: 515.0, gain: 0.25, wave: 'sine', sustain: 0.63, release: 0.09 });
  addTone(b, { start: 0.085, duration: 0.30, freq: 648.0, gain: 0.24, wave: 'sine', sustain: 0.66, release: 0.09 });
  addTone(b, { start: 0.19, duration: 0.40, freq: 772.0, gain: 0.27, wave: 'triangle', sustain: 0.61, release: 0.15 });
  addTone(b, { start: 0.305, duration: 0.33, freq: 1028.0, gain: 0.15, wave: 'sine', sustain: 0.48, release: 0.14 });
  addSimpleDelay(b, 0.092, 0.23);
  return normalize(b, 0.9);
}

function buildAgeAdvanceShimmer() {
  const b = makeBuffer(0.84);
  addTone(b, { start: 0.00, duration: 0.27, freq: 531.0, gain: 0.25, wave: 'sine', sustain: 0.64, release: 0.09 });
  addTone(b, { start: 0.078, duration: 0.30, freq: 666.0, gain: 0.23, wave: 'sine', sustain: 0.66, release: 0.09 });
  addTone(b, { start: 0.175, duration: 0.41, freq: 795.0, gain: 0.28, wave: 'triangle', sustain: 0.6, release: 0.16 });
  addTone(b, { start: 0.295, duration: 0.34, freq: 1062.0, gain: 0.16, wave: 'sine', sustain: 0.5, release: 0.15 });
  addSimpleDelay(b, 0.087, 0.22);
  return normalize(b, 0.9);
}

function buildAgeAdvanceHeroic() {
  const b = makeBuffer(0.87);
  addTone(b, { start: 0.00, duration: 0.28, freq: 523.25, gain: 0.26, wave: 'sine', sustain: 0.65, release: 0.09 });
  addTone(b, { start: 0.082, duration: 0.305, freq: 659.25, gain: 0.245, wave: 'sine', sustain: 0.67, release: 0.09 });
  addTone(b, { start: 0.185, duration: 0.405, freq: 783.99, gain: 0.275, wave: 'triangle', sustain: 0.61, release: 0.16 });
  addTone(b, { start: 0.302, duration: 0.33, freq: 1046.5, gain: 0.155, wave: 'sine', sustain: 0.5, release: 0.16 });
  addSimpleDelay(b, 0.095, 0.245);
  return normalize(b, 0.9);
}

function buildCatastrophe() {
  const b = makeBuffer(1.05);
  addTone(b, { start: 0.00, duration: 0.55, freq: 280, freqEnd: 170, gain: 0.34, wave: 'saw', sustain: 0.7, release: 0.2 });
  addTone(b, { start: 0.06, duration: 0.60, freq: 140, freqEnd: 95, gain: 0.28, wave: 'square', sustain: 0.62, release: 0.24 });
  addNoise(b, { start: 0.0, duration: 0.26, gain: 0.08, color: 'pink', sustain: 0.15, release: 0.15 });
  addNoise(b, { start: 0.35, duration: 0.28, gain: 0.06, color: 'pink', sustain: 0.25, release: 0.2 });
  addSimpleDelay(b, 0.11, 0.2);
  return normalize(b, 0.9);
}

function buildCatastrophePulse() {
  const b = makeBuffer(1.06);
  addTone(b, { start: 0.0, duration: 0.54, freq: 272, freqEnd: 165, gain: 0.34, wave: 'saw', sustain: 0.69, release: 0.2 });
  addTone(b, { start: 0.062, duration: 0.6, freq: 136, freqEnd: 92, gain: 0.275, wave: 'square', sustain: 0.62, release: 0.24 });
  addNoise(b, { start: 0.0, duration: 0.25, gain: 0.074, color: 'pink', sustain: 0.16, release: 0.15 });
  addNoise(b, { start: 0.355, duration: 0.27, gain: 0.058, color: 'pink', sustain: 0.24, release: 0.2 });
  addSimpleDelay(b, 0.108, 0.2);
  return normalize(b, 0.9);
}

function buildCatastropheRumble() {
  const b = makeBuffer(1.08);
  addTone(b, { start: 0.0, duration: 0.56, freq: 286, freqEnd: 174, gain: 0.335, wave: 'saw', sustain: 0.7, release: 0.21 });
  addTone(b, { start: 0.058, duration: 0.61, freq: 144, freqEnd: 98, gain: 0.27, wave: 'square', sustain: 0.62, release: 0.24 });
  addNoise(b, { start: 0.01, duration: 0.24, gain: 0.078, color: 'pink', sustain: 0.16, release: 0.14 });
  addNoise(b, { start: 0.36, duration: 0.28, gain: 0.062, color: 'pink', sustain: 0.24, release: 0.2 });
  addSimpleDelay(b, 0.112, 0.2);
  return normalize(b, 0.9);
}

function buildCatastropheAlarm() {
  const b = makeBuffer(1.04);
  addTone(b, { start: 0.0, duration: 0.545, freq: 276, freqEnd: 168, gain: 0.345, wave: 'saw', sustain: 0.69, release: 0.2 });
  addTone(b, { start: 0.062, duration: 0.595, freq: 138, freqEnd: 94, gain: 0.282, wave: 'square', sustain: 0.62, release: 0.24 });
  addNoise(b, { start: 0.0, duration: 0.255, gain: 0.075, color: 'pink', sustain: 0.16, release: 0.15 });
  addNoise(b, { start: 0.35, duration: 0.275, gain: 0.06, color: 'pink', sustain: 0.24, release: 0.2 });
  addSimpleDelay(b, 0.11, 0.205);
  return normalize(b, 0.9);
}

function buildDominantRoll() {
  const b = makeBuffer(0.72);
  const notes = [392.0, 493.88, 587.33, 783.99];
  notes.forEach((n, idx) => {
    addTone(b, {
      start: idx * 0.085,
      duration: 0.14,
      freq: n,
      gain: 0.23,
      wave: 'triangle',
      sustain: 0.45,
      release: 0.09
    });
  });
  addTone(b, { start: 0.34, duration: 0.26, freq: 1046.5, gain: 0.14, wave: 'sine', sustain: 0.4, release: 0.16 });
  addSimpleDelay(b, 0.07, 0.19);
  return normalize(b, 0.9);
}

function buildDominantRollSpark() {
  const b = makeBuffer(0.73);
  const notes = [392.0, 493.88, 587.33, 783.99];
  notes.forEach((n, idx) => {
    addTone(b, {
      start: idx * 0.082,
      duration: 0.138,
      freq: n * 1.015,
      gain: 0.225,
      wave: 'triangle',
      sustain: 0.44,
      release: 0.088
    });
  });
  addTone(b, { start: 0.338, duration: 0.25, freq: 1068.0, gain: 0.135, wave: 'sine', sustain: 0.4, release: 0.15 });
  addSimpleDelay(b, 0.069, 0.19);
  return normalize(b, 0.9);
}

function buildDominantRollHeavy() {
  const b = makeBuffer(0.74);
  const notes = [392.0, 493.88, 587.33, 783.99];
  notes.forEach((n, idx) => {
    addTone(b, {
      start: idx * 0.086,
      duration: 0.142,
      freq: n * 0.988,
      gain: 0.235,
      wave: 'triangle',
      sustain: 0.45,
      release: 0.09
    });
  });
  addTone(b, { start: 0.343, duration: 0.258, freq: 1038.0, gain: 0.145, wave: 'sine', sustain: 0.4, release: 0.16 });
  addSimpleDelay(b, 0.071, 0.19);
  return normalize(b, 0.9);
}

function buildDominantRollArcane() {
  const b = makeBuffer(0.72);
  const notes = [392.0, 493.88, 587.33, 783.99];
  notes.forEach((n, idx) => {
    addTone(b, {
      start: idx * 0.084,
      duration: 0.14,
      freq: n * 1.006,
      gain: 0.228,
      wave: 'triangle',
      sustain: 0.45,
      release: 0.09
    });
  });
  addTone(b, { start: 0.34, duration: 0.26, freq: 1055.0, gain: 0.14, wave: 'sine', sustain: 0.4, release: 0.16 });
  addSimpleDelay(b, 0.072, 0.19);
  return normalize(b, 0.9);
}

const outDir = path.resolve('public/assets/sfx');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const assets = [
  ['click.wav', buildClick()],
  ['click-soft.wav', buildClickSoft()],
  ['click-bright.wav', buildClickBright()],
  ['click-deep.wav', buildClickDeep()],
  ['age-advance.wav', buildAgeAdvance()],
  ['age-advance-warm.wav', buildAgeAdvanceWarm()],
  ['age-advance-shimmer.wav', buildAgeAdvanceShimmer()],
  ['age-advance-heroic.wav', buildAgeAdvanceHeroic()],
  ['catastrophe.wav', buildCatastrophe()],
  ['catastrophe-pulse.wav', buildCatastrophePulse()],
  ['catastrophe-rumble.wav', buildCatastropheRumble()],
  ['catastrophe-alarm.wav', buildCatastropheAlarm()],
  ['dominant-roll.wav', buildDominantRoll()],
  ['dominant-roll-spark.wav', buildDominantRollSpark()],
  ['dominant-roll-heavy.wav', buildDominantRollHeavy()],
  ['dominant-roll-arcane.wav', buildDominantRollArcane()],
];

for (const [name, data] of assets) {
  const target = path.join(outDir, name);
  writeWavMonoFloat32(target, data);
  console.log(`wrote ${target}`);
}

console.log('SFX generation complete.');
