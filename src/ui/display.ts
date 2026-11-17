import type { Vec } from '../engine/vec';

export interface Glyph {
  readonly char: string;
  readonly fg: string;
  readonly bg?: string;
}

/**
 * Creatures and items are drawn as shapes, not letters: at a glance a ghost
 * reads as "someone", a mug, stick or cloth as "something", and none looks like a tile.
 */
export type SpriteShape = 'hero' | 'ghost' | 'horned' | 'mug' | 'stick' | 'cloth';

export interface Sprite {
  readonly shape: SpriteShape;
  readonly color: string;
  /** Diameter as a fraction of a cell; above 1 the sprite spills into neighbouring cells. */
  readonly size: number;
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
 * All coordinates are in cells and may be fractional.
 */
export interface Display {
  readonly columns: number;
  readonly rows: number;
  clear(): void;
  drawGlyph(pos: Vec, glyph: Glyph): void;
  /** Centred in the cell at `pos`. */
  drawSprite(pos: Vec, sprite: Sprite): void;
  drawText(x: number, y: number, text: string, style: TextStyle): void;
  fillRect(x: number, y: number, width: number, height: number, color: string): void;
  strokeRect(x: number, y: number, width: number, height: number, color: string): void;
}
