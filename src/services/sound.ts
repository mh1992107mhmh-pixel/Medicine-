import { NotificationSoundType } from '../types';

export const SOUND_DEFINITIONS: Record<
  NotificationSoundType,
  { label: string; description: string; icon: string }
> = {
  gentle_chime: {
    label: 'رنين هادئ وناعم',
    description: 'نغمة لطيفة ومريحة مناسبة للصباح والمنزل',
    icon: '🔔',
  },
  tri_tone_alarm: {
    label: 'تنبيه طبي ثلاثي (واضح)',
    description: 'نغمة طبية مميزة ومنبهة لضمان عدم تفويت الجرعة',
    icon: '🚨',
  },
  marimba_harmony: {
    label: 'ماريمبا متناغمة',
    description: 'نغمات خشبية دافئة وعصرية لطيفة على الأذن',
    icon: '🎵',
  },
  pulse_beep: {
    label: 'نبضات إيقاعية (Pager)',
    description: 'نغمة بيجر طبية كلاسيكية ذات تباين صوتي عالي',
    icon: '📟',
  },
  harp_melody: {
    label: 'قيثارة هادئة (Harp)',
    description: 'معزوفة أوتار متدرجة تضفي شعوراً بالراحة والسكينة',
    icon: '🪕',
  },
};

class SoundService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Master method to play any of the customizable sound profiles
  playSound(type: NotificationSoundType = 'tri_tone_alarm', volume = 0.7) {
    switch (type) {
      case 'gentle_chime':
        this.playGentleChime(volume);
        break;
      case 'tri_tone_alarm':
        this.playMedicationAlarm(volume);
        break;
      case 'marimba_harmony':
        this.playMarimbaHarmony(volume);
        break;
      case 'pulse_beep':
        this.playPulseBeep(volume);
        break;
      case 'harp_melody':
        this.playHarpMelody(volume);
        break;
      default:
        this.playMedicationAlarm(volume);
        break;
    }
  }

  // 1. Gentle dual chime
  playGentleChime(volume = 0.6) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0, now + idx * 0.14);
      gain.gain.linearRampToValueAtTime(volume * 0.5, now + idx * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.85);
    });
  }

  // 2. Urgent tri-tone medical alarm
  playMedicationAlarm(volume = 0.7) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.16);

      gain.gain.setValueAtTime(0, now + i * 0.16);
      gain.gain.linearRampToValueAtTime(volume * 0.65, now + i * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.95);
    });
  }

  // 3. Warm marimba harmony
  playMarimbaHarmony(volume = 0.65) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(volume * 0.6, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.65);
    });
  }

  // 4. Rhythmic pager beep
  playPulseBeep(volume = 0.6) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pulses = [0, 0.18, 0.36];

    pulses.forEach((timeOffset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(950, now + timeOffset);

      gain.gain.setValueAtTime(0, now + timeOffset);
      gain.gain.linearRampToValueAtTime(volume * 0.3, now + timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.13);
    });
  }

  // 5. Cascading harp melody
  playHarpMelody(volume = 0.65) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [587.33, 739.99, 880.0, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(volume * 0.5, now + i * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.9);
    });
  }

  // Celebratory taken sound
  playTakenSuccess(volume = 0.5) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 783.99, 1046.5];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(volume * 0.5, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.75);
    });
  }

  // Snooze tone
  playSnoozeTone(volume = 0.4) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.25);

    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }
}

export const sound = new SoundService();
