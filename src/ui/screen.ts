import type { Display } from './display';
import type { Input } from './input';

/** State pattern: each screen owns its own input handling and rendering. */
export interface Screen {
  /** Returns true if the input was handled and the screen needs redrawing. */
  handleInput(input: Input): boolean;
  render(display: Display): void;
  onEnter?(): void;
}
