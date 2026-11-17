import { ALL_DIRECTIONS, type Vec } from '../engine/vec';
import type { Actor } from '../world/actor';
import { Monster } from '../world/monster';
import type { Stage } from '../world/stage';
import { type TileName, Tiles } from '../world/tile';
import { actorSprite } from './actor-view';
import { mixColors } from './color';
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
export function drawItems(display: Display, stage: Stage): void {
  for (const { type, pos } of stage.items) {
    if (stage.isVisible(pos)) display.drawSprite(pos, theme.items[type.id]);
  }
}

/** `positionOf` says where to draw each actor, which differs from its cell while it is animated. */
export function drawActors(display: Display, stage: Stage, positionOf: (actor: Actor) => Vec): void {
  for (const actor of stage.actors) {
    if (!stage.isVisible(actor.pos)) continue;
    const pos = positionOf(actor);
    display.drawSprite(pos, actorSprite(actor));
    // Only wounded monsters get a bar: a full one on every ghost would be noise.
    if (actor instanceof Monster && actor.hp < actor.maxHp) {
      drawHealthBar(display, pos.x + 0.1, pos.y + 0.9, 0.8, actor.hp / actor.maxHp);
    }
  }
}

export function drawHealthBar(
  display: Display,
  x: number,
  y: number,
  width: number,
  health: number,
  height = 0.14,
): void {
  display.fillRect(x, y, width, height, theme.background);
  display.fillRect(x, y, width * health, height, healthColor(health));
}

function healthColor(health: number): string {
  return mixColors(theme.hpLow, theme.hpFull, health);
}

function bordersOpenSpace(stage: Stage, pos: Vec): boolean {
  return ALL_DIRECTIONS.some((direction) => stage.isWalkable(pos.add(direction)));
}
