import { Rng } from '../engine/rng';
import { Vec } from '../engine/vec';
import type { Display } from './display';
import { theme } from './theme';

const STAR_CHARS = ['·', '·', '·', '˙', '+'];

/**
 * A sparse night sky behind the menus. Seeded so it stays put across redraws;
 * rows holding text are skipped so no star lands inside a word.
 */
export function drawStars(display: Display, seed: number, textRows: ReadonlySet<number>): void {
  const rng = new Rng(seed);
  const count = Math.floor((display.columns * display.rows) / 30);
  for (let i = 0; i < count; i++) {
    const pos = new Vec(rng.int(0, display.columns - 1), rng.int(0, display.rows - 1));
    const char = rng.pick(STAR_CHARS);
    const fg = rng.chance(0.2) ? theme.dim : theme.faint;
    if (!textRows.has(pos.y)) display.drawGlyph(pos, { char, fg });
  }
}

/** Rows `from`…`to` inclusive, for marking where large text sits. */
export function rowRange(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
