import type { Vec } from '../engine/vec';
import type { Display } from './display';
import type { Input } from './input';

/** State pattern: each screen owns its own input handling and rendering. */
export interface Screen {
  /**
   * Returns true if the input was handled and the screen needs redrawing.
   * `isRepeat` marks the key auto-repeating while held; only directions repeat.
   */
  handleInput(input: Input, isRepeat?: boolean): boolean;
  render(display: Display): void;
  /** Called every frame while the screen is on top. Returns true to redraw: something is animating. */
  update?(now: number): boolean;
  /** The window lost focus. Returns true to redraw. */
  pause?(): boolean;
  /** The pointer moved to `cell`, or off the canvas (null). Returns true to redraw. */
  hover?(cell: Vec | null): boolean;
  /** A mouse click or a tap on `cell`. Returns true to redraw. */
  click?(cell: Vec): boolean;
  onEnter?(): void;
}
