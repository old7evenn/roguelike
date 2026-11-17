import type { Vec } from '../engine/vec';
import type { Display } from './display';
import { DIRECTION_INPUTS, type Input } from './input';
import type { Screen } from './screen';
import { Sound } from './sound';

/**
 * A stack of screens: input goes to the top one, and all of them are drawn
 * bottom-up, so an overlay like the inventory shows the game behind it.
 * Redraws only when something changed.
 */
export class Ui {
  readonly sound = new Sound();
  private readonly display: Display;
  private readonly screens: Screen[] = [];
  /** Keys held down right now, oldest first. Tracked here, not per screen, so a key released over an overlay is still let go. */
  private readonly held: Input[] = [];
  private dirty = true;

  constructor(display: Display) {
    this.display = display;
  }

  /** Replaces every screen with this one. */
  goTo(screen: Screen): void {
    this.screens.length = 0;
    this.push(screen);
  }

  push(screen: Screen): void {
    this.screens.push(screen);
    screen.onEnter?.();
    this.dirty = true;
  }

  pop(): void {
    this.screens.pop();
    this.dirty = true;
  }

  /** A key or on-screen button went down; `isRepeat` when it is the OS repeating a held key. */
  press(input: Input, isRepeat: boolean): boolean {
    if (!this.held.includes(input)) this.held.push(input);
    // Repeating "open inventory" would open and close it in turn; only directions repeat.
    if (isRepeat && !DIRECTION_INPUTS.includes(input)) return true;
    return this.handleInput(input, isRepeat);
  }

  release(input: Input): void {
    const index = this.held.indexOf(input);
    if (index !== -1) this.held.splice(index, 1);
  }

  /** The window lost focus: keyup events won't arrive, so every key counts as released. */
  blur(): void {
    this.held.length = 0;
    if (this.screens.at(-1)?.pause?.()) this.dirty = true;
  }

  /** The most recently pressed of `inputs` that is still held down. */
  latestHeld(inputs: readonly Input[]): Input | undefined {
    for (let i = this.held.length - 1; i >= 0; i--) {
      const input = this.held[i];
      if (input && inputs.includes(input)) return input;
    }
    return undefined;
  }

  private handleInput(input: Input, isRepeat: boolean): boolean {
    if (input === 'sound') {
      if (isRepeat) return true;
      this.sound.toggle();
      this.dirty = true;
      return true;
    }
    const handled = this.screens.at(-1)?.handleInput(input, isRepeat) ?? false;
    if (handled) this.dirty = true;
    return handled;
  }

  hover(cell: Vec | null): void {
    if (this.screens.at(-1)?.hover?.(cell)) this.dirty = true;
  }

  click(cell: Vec): void {
    if (this.screens.at(-1)?.click?.(cell)) this.dirty = true;
  }

  invalidate(): void {
    this.dirty = true;
  }

  refresh(now: number): void {
    if (this.screens.at(-1)?.update?.(now)) this.dirty = true;
    if (!this.dirty) return;
    this.display.clear();
    for (const screen of this.screens) screen.render(this.display);
    this.dirty = false;
  }
}
