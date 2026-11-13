import { ALL_DIRECTIONS, type Vec } from '../engine/vec';
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

function bordersOpenSpace(stage: Stage, pos: Vec): boolean {
  return ALL_DIRECTIONS.some((direction) => stage.isWalkable(pos.add(direction)));
}
