import type { Game } from '../world/game';

const STORAGE_KEY = 'roguelike-sound';

interface Tone {
  readonly frequency: number;
  readonly endFrequency?: number;
  readonly duration: number;
  readonly delay?: number;
  readonly type?: OscillatorType;
  readonly volume?: number;
}

/** Synthesised sound effects driven only by events from the game world. */
export class Sound {
  private context: AudioContext | null = null;
  private enabled = readPreference();

  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Must be called from a keyboard or pointer event so browsers allow audio. */
  unlock(): void {
    if (!this.enabled) return;
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume().catch(() => undefined);
  }

  toggle(): void {
    this.enabled = !this.enabled;
    writePreference(this.enabled);

    if (this.enabled) {
      this.unlock();
      this.play(
        { frequency: 440, duration: 0.07, type: 'sine' },
        { frequency: 660, duration: 0.09, delay: 0.07, type: 'sine' },
      );
      return;
    }

    const context = this.context;
    this.context = null;
    if (context) void context.close().catch(() => undefined);
  }

  listenTo(game: Game): void {
    game.events.on('attack', ({ attacker }) => {
      this.play({
        frequency: attacker === game.hero ? 180 : 120,
        endFrequency: 70,
        duration: 0.09,
        type: 'square',
        volume: 0.035,
      });
    });
    game.events.on('death', () => {
      this.play({ frequency: 260, endFrequency: 55, duration: 0.28, type: 'sine' });
    });
    game.events.on('itemPickedUp', () => {
      this.play(
        { frequency: 440, duration: 0.06, type: 'sine' },
        { frequency: 660, duration: 0.09, delay: 0.06, type: 'sine' },
      );
    });
    game.events.on('depthChanged', () => {
      this.play(
        { frequency: 330, duration: 0.1, type: 'triangle' },
        { frequency: 247, duration: 0.1, delay: 0.08, type: 'triangle' },
        { frequency: 165, duration: 0.16, delay: 0.16, type: 'triangle' },
      );
    });
    game.events.on('defeat', () => {
      this.play({ frequency: 180, endFrequency: 45, duration: 0.7, type: 'sawtooth', volume: 0.025 });
    });
    game.events.on('victory', () => {
      this.play(
        { frequency: 392, duration: 0.14, type: 'triangle' },
        { frequency: 523, duration: 0.14, delay: 0.12, type: 'triangle' },
        { frequency: 659, duration: 0.14, delay: 0.24, type: 'triangle' },
        { frequency: 784, duration: 0.35, delay: 0.36, type: 'triangle' },
      );
    });
  }

  private play(...tones: readonly Tone[]): void {
    const context = this.context;
    if (!this.enabled || !context || context.state === 'closed') return;

    for (const tone of tones) {
      const start = context.currentTime + (tone.delay ?? 0);
      const end = start + tone.duration;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = tone.type ?? 'sine';
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      if (tone.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(tone.volume ?? 0.04, start + Math.min(0.01, tone.duration / 2));
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    }
  }
}

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function writePreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // The game still works when storage is blocked or unavailable.
  }
}
