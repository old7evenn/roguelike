import type { Array2D } from '../engine/array2d';
import { distanceMap, farthestReachable } from '../engine/distance-map';
import { Rng } from '../engine/rng';
import type { Vec } from '../engine/vec';
import { Tiles, type TileType } from '../world/tile';
import type { DungeonGenerator } from './dungeon-generator';

export interface Level {
  tiles: Array2D<TileType>;
  start: Vec;
  exit: Vec;
}

/**
 * Generator-independent finishing: the exit goes on the reachable cell farthest
 * from the start, so every floor has to be crossed and can never softlock.
 * Without stairs (the last floor) the exit cell stays floor: the boss stands there.
 */
export function buildLevel(generator: DungeonGenerator, seed: number, hasStairs = true): Level {
  const { tiles, start } = generator.generate(new Rng(seed));
  const distances = distanceMap(tiles.width, tiles.height, start, (pos) => tiles.get(pos).isWalkable);
  const exit = farthestReachable(distances);
  if (hasStairs) tiles.set(exit, Tiles.stairsDown);
  return { tiles, start, exit };
}

/** Reachable plain floor more than `minDistance` steps from the start; the exit cell is excluded. */
export function floorAwayFromStart(level: Level, minDistance: number): Vec[] {
  const { tiles, start } = level;
  const fromStart = distanceMap(tiles.width, tiles.height, start, (pos) => tiles.get(pos).isWalkable);
  const cells: Vec[] = [];
  for (const [pos, tile] of tiles.entries()) {
    const distance = fromStart.get(pos);
    const isFree = tile === Tiles.floor && !pos.equals(level.exit);
    if (isFree && Number.isFinite(distance) && distance > minDistance) cells.push(pos);
  }
  return cells;
}
