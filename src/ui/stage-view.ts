import { ALL_DIRECTIONS, type Vec } from '../engine/vec';
import { Monster } from '../world/monster';
import type { Stage } from '../world/stage';
import { Tiles } from '../world/tile';
import type { Display } from './display';
import { theme } from './theme';

export function drawStage(display: Display, stage: Stage): void {
  for (const [pos, tile] of stage.tiles.entries()) {
    // Only walls bordering open space are drawn; solid rock stays black.
    if (tile === Tiles.wall && !bordersOpenSpace(stage, pos)) continue;
    display.drawGlyph(pos, theme.tiles[tile.name]);
  }
}

export function drawActors(display: Display, stage: Stage): void {
  for (const actor of stage.actors) {
    const glyph = actor instanceof Monster ? theme.monsters[actor.breed.id] : theme.hero;
    // The tile's background hides the floor dot that would otherwise show through the letter.
    display.drawGlyph(actor.pos, { ...glyph, bg: theme.tiles[stage.tileAt(actor.pos).name].bg });
  }
}

function bordersOpenSpace(stage: Stage, pos: Vec): boolean {
  return ALL_DIRECTIONS.some((direction) => stage.isWalkable(pos.add(direction)));
}
