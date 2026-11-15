import { ALL_DIRECTIONS, type Vec } from '../engine/vec';
import type { Stage } from '../world/stage';
import { type TileName, Tiles } from '../world/tile';
import { actorGlyph } from './actor-view';
import type { Display, Glyph } from './display';
import { rememberedGlyph, theme } from './theme';

export type TileGlyphs = Record<TileName, Glyph>;

/** Unexplored cells stay black; explored ones out of sight are drawn faded, as remembered. */
export function drawStage(display: Display, stage: Stage, glyphs: TileGlyphs): void {
  for (const [pos, tile] of stage.tiles.entries()) {
    if (!stage.isExplored(pos)) continue;
    // Only walls bordering open space are drawn; solid rock stays black.
    if (tile === Tiles.wall && !bordersOpenSpace(stage, pos)) continue;
    const glyph = glyphs[tile.name];
    display.drawGlyph(pos, stage.isVisible(pos) ? glyph : rememberedGlyph(glyph));
  }
}

/** Items and actors move or vanish, so only the ones in sight are drawn. */
export function drawItems(display: Display, stage: Stage, glyphs: TileGlyphs): void {
  for (const { type, pos } of stage.items) {
    if (!stage.isVisible(pos)) continue;
    display.drawGlyph(pos, { ...theme.items[type.id], bg: glyphs[stage.tileAt(pos).name].bg });
  }
}

export function drawActors(display: Display, stage: Stage, glyphs: TileGlyphs): void {
  for (const actor of stage.actors) {
    if (!stage.isVisible(actor.pos)) continue;
    // The tile's background hides the floor dot that would otherwise show through the letter.
    display.drawGlyph(actor.pos, { ...actorGlyph(actor), bg: glyphs[stage.tileAt(actor.pos).name].bg });
  }
}

function bordersOpenSpace(stage: Stage, pos: Vec): boolean {
  return ALL_DIRECTIONS.some((direction) => stage.isWalkable(pos.add(direction)));
}
