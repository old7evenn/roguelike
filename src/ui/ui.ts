import type { Display } from './display';
import type { Input } from './input';
import type { Screen } from './screen';

/** Holds the active screen and redraws only when something changed. */
export class Ui {
  private readonly display: Display;
  private screen: Screen | null = null;
  private dirty = true;

  constructor(display: Display) {
    this.display = display;
  }

  goTo(screen: Screen): void {
    this.screen = screen;
    screen.onEnter?.();
    this.dirty = true;
  }

  handleInput(input: Input): boolean {
    const handled = this.screen?.handleInput(input) ?? false;
    if (handled) this.dirty = true;
    return handled;
  }

  invalidate(): void {
    this.dirty = true;
  }

  refresh(): void {
    if (!this.dirty || !this.screen) return;
    this.display.clear();
    this.screen.render(this.display);
    this.dirty = false;
  }
}
