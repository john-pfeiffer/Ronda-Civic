// Sound. Effects are synthesised so the game ships with no audio files;
// music plays the band's tracks from config/music.ts, or a placeholder beat until they are added.
import { MUSIC } from '../config/music';

type Slot = keyof typeof MUSIC;

class AudioSys {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private el: HTMLAudioElement | null = null;
  private slot: Slot | null = null;
  private beatTimer: number | null = null;
  private nextBeat = 0;
  private step = 0;
  muted = false;
  nowPlaying = '';

  /** Browsers only allow audio after a tap or key press; call this from one. */
  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.el && this.el.paused && !this.muted) void this.el.play().catch(() => {});
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ctx) this.master.gain.value = m ? 0 : 0.9;
    if (this.el) this.el.muted = m;
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, gain: number, delay = 0, dest?: AudioNode) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(dest ?? this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noiseBuf: AudioBuffer | null = null;
  private noise(dur: number, gain: number, f0: number, f1: number, type: BiquadFilterType = 'lowpass', delay = 0, dest?: AudioNode) {
    const c = this.ctx;
    if (!c) return;
    if (!this.noiseBuf) {
      this.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f).connect(g).connect(dest ?? this.master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  sfx(name: string): void {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'swing': this.noise(0.14, 0.22, 900, 3200, 'bandpass'); break;
      case 'heavySwing': this.noise(0.24, 0.3, 400, 2200, 'bandpass'); break;
      case 'hit': this.tone('sine', 190, 60, 0.12, 0.7); this.noise(0.08, 0.4, 2600, 600); break;
      case 'heavy': this.tone('sine', 150, 40, 0.24, 0.9); this.noise(0.18, 0.55, 2000, 300); this.tone('square', 90, 50, 0.1, 0.25); break;
      case 'tick': this.tone('square', 900, 500, 0.04, 0.25); this.noise(0.03, 0.2, 5000, 2500, 'highpass'); break;
      case 'jump': this.tone('triangle', 280, 620, 0.13, 0.3); break;
      case 'land': this.tone('sine', 110, 50, 0.1, 0.5); this.noise(0.06, 0.15, 800, 200); break;
      case 'pickup': this.tone('square', 660, 660, 0.07, 0.22); this.tone('square', 990, 990, 0.12, 0.22, 0.07); break;
      case 'food': this.tone('triangle', 440, 660, 0.1, 0.3); this.tone('triangle', 660, 880, 0.14, 0.3, 0.09); break;
      case 'power': [0, 1, 2, 3, 4].forEach((i) => this.tone('sawtooth', 220 * Math.pow(1.26, i), 220 * Math.pow(1.26, i + 1), 0.12, 0.2, i * 0.06)); break;
      case 'special': this.tone('sawtooth', 110, 220, 0.4, 0.3); this.tone('sawtooth', 165, 330, 0.4, 0.25); this.noise(0.4, 0.2, 400, 6000, 'bandpass'); break;
      case 'squeal': this.tone('sawtooth', 700, 1150, 0.12, 0.2); this.tone('sawtooth', 1150, 420, 0.22, 0.2, 0.12); break;
      case 'bark': this.tone('square', 520, 300, 0.07, 0.3); this.tone('square', 560, 280, 0.09, 0.3, 0.12); break;
      case 'crash': this.noise(0.35, 0.6, 3000, 200); this.tone('square', 120, 50, 0.15, 0.3); break;
      case 'slam': this.tone('sine', 90, 28, 0.55, 1); this.noise(0.5, 0.7, 1200, 80); break;
      case 'roar': this.tone('sawtooth', 110, 70, 0.8, 0.45); this.tone('sawtooth', 83, 55, 0.8, 0.4); this.noise(0.8, 0.3, 500, 200); break;
      case 'throw': this.noise(0.2, 0.25, 500, 2600, 'bandpass'); break;
      case 'ui': this.tone('square', 520, 780, 0.06, 0.2); break;
      case 'select': this.tone('square', 520, 520, 0.06, 0.22); this.tone('square', 780, 780, 0.06, 0.22, 0.07); this.tone('square', 1040, 1040, 0.14, 0.22, 0.14); break;
      case 'hurt': this.tone('square', 300, 120, 0.16, 0.3); this.noise(0.1, 0.3, 1800, 500); break;
      case 'win': [0, 4, 7, 12].forEach((s, i) => this.tone('square', 330 * Math.pow(2, s / 12), 330 * Math.pow(2, s / 12), 0.2, 0.22, i * 0.13)); break;
      case 'lose': [0, -3, -7].forEach((s, i) => this.tone('sawtooth', 220 * Math.pow(2, s / 12), 200 * Math.pow(2, s / 12), 0.3, 0.25, i * 0.22)); break;
    }
  }

  /** Switch music. Uses the band's track for the slot if one is configured. */
  music(slot: Slot | null): void {
    if (slot === this.slot) return;
    this.slot = slot;
    if (this.el) {
      this.el.pause();
      this.el = null;
    }
    if (this.beatTimer !== null) {
      clearInterval(this.beatTimer);
      this.beatTimer = null;
    }
    this.nowPlaying = '';
    if (!slot) return;
    const track = MUSIC[slot];
    if (track) {
      this.el = new Audio(`${import.meta.env.BASE_URL}audio/music/${track.file}`);
      this.el.loop = true;
      this.el.volume = 0.7;
      this.el.muted = this.muted;
      this.nowPlaying = track.title;
      void this.el.play().catch(() => {});
      return;
    }
    // Placeholder beat until real tracks are added.
    this.step = 0;
    this.nextBeat = 0;
    this.beatTimer = window.setInterval(() => this.schedule(slot), 60);
  }

  private schedule(slot: Slot) {
    const c = this.ctx;
    if (!c || this.muted) return;
    const bpm = slot === 'boss' ? 184 : slot === 'level' ? 168 : slot === 'victory' ? 150 : 120;
    const eighth = 30 / bpm;
    if (this.nextBeat < c.currentTime) this.nextBeat = c.currentTime + 0.05;
    const roots = slot === 'boss' ? [41.2, 41.2, 49, 46.25] : slot === 'title' ? [55, 65.4, 49, 73.4] : [82.4, 98, 110, 73.4];
    while (this.nextBeat < c.currentTime + 0.15) {
      const s = this.step++;
      const d = this.nextBeat - c.currentTime;
      const beat = s % 8;
      const root = roots[Math.floor(s / 16) % roots.length] * (slot === 'title' ? 2 : 2);
      if (beat === 0 || beat === 3 || beat === 4) this.tone('sine', 140, 45, 0.14, 0.7, d, this.musicGain);
      if (beat === 2 || beat === 6) {
        this.noise(0.12, 0.45, 3500, 900, 'bandpass', d, this.musicGain);
        this.tone('triangle', 220, 150, 0.08, 0.3, d, this.musicGain);
      }
      if (slot !== 'title' || beat % 2 === 0) this.noise(0.03, 0.12, 8000, 6000, 'highpass', d, this.musicGain);
      this.tone('sawtooth', root, root, eighth * 0.9, 0.22, d, this.musicGain);
      if (beat === 7 && s % 16 === 15) this.tone('sawtooth', root * 1.5, root * 1.5, eighth * 0.9, 0.2, d, this.musicGain);
      this.nextBeat += eighth;
    }
  }
}

export const audio = new AudioSys();
