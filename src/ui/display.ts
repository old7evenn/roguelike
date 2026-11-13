import type { Vec } from '../engine/vec';

export interface Glyph {
  readonly char: string;
  readonly fg: string;
  readonly bg?: string;
}

export interface TextStyle {
  color: string;
  /** Multiplier of the cell font size. */
  scale?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * A grid of character cells. Screens draw through this interface only,
 * so the canvas backend can be replaced without touching them.
 */
export interface Display {
  readonly columns: number;
  readonly rows: number;
  clear(): void;
  drawGlyph(pos: Vec, glyph: Glyph): void;
  /** `x` and `y` are in cells and may be fractional. */
  drawText(x: number, y: number, text: string, style: TextStyle): void;
}
