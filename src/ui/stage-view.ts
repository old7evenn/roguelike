import { ALL_DIRECTIONS, type Vec } from '../engine/vec';
import type { Stage } from '../world/stage';
import { type TileName, Tiles } from '../world/tile';
import { actorGlyph } from './actor-view';
import type { Display, Glyph } from './display';
import { theme } from './theme';

export type TileGlyphs = Record<TileName, Glyph>;

export function drawStage(display: Display, stage: Stage, glyphs: TileGlyphs): void {
  for (const [pos, tile] of stage.tiles.entries()) {
    // Only walls bordering open space are drawn; solid rock stays black.
    if (tile === Tiles.wall && !bordersOpenSpace(stage, pos)) continue;
    display.drawGlyph(pos, glyphs[tile.name]);
  }
}

export function drawItems(display: Display, stage: Stage, glyphs: TileGlyphs): void {
  for (const { type, pos } of stage.items) {
    display.drawGlyph(pos, { ...theme.items[type.id], bg: glyphs[stage.tileAt(pos).name].bg });
  }
}

export function drawActors(display: Display, stage: Stage, glyphs: TileGlyphs): void {
  for (const actor of stage.actors) {
    // The tile's background hides the floor dot that would otherwise show through the letter.
    display.drawGlyph(actor.pos, { ...actorGlyph(actor), bg: glyphs[stage.tileAt(actor.pos).name].bg });
  }
}

function bordersOpenSpace(stage: Stage, pos: Vec): boolean {
  return ALL_DIRECTIONS.some((direction) => stage.isWalkable(pos.add(direction)));
}
