import type { Display } from './display';
import type { Input } from './input';
import type { Screen } from './screen';

/**
 * A stack of screens: input goes to the top one, and all of them are drawn
 * bottom-up, so an overlay like the inventory shows the game behind it.
 * Redraws only when something changed.
 */
export class Ui {
  private readonly display: Display;
  private readonly screens: Screen[] = [];
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

  handleInput(input: Input): boolean {
    const handled = this.screens.at(-1)?.handleInput(input) ?? false;
    if (handled) this.dirty = true;
    return handled;
  }

  invalidate(): void {
    this.dirty = true;
  }

  refresh(): void {
    if (!this.dirty) return;
    this.display.clear();
    for (const screen of this.screens) screen.render(this.display);
    this.dirty = false;
  }
}
