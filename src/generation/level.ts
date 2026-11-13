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
 */
export function buildLevel(generator: DungeonGenerator, seed: number): Level {
  const { tiles, start } = generator.generate(new Rng(seed));
  const distances = distanceMap(tiles.width, tiles.height, start, (pos) => tiles.get(pos).isWalkable);
  const exit = farthestReachable(distances);
  tiles.set(exit, Tiles.stairsDown);
  return { tiles, start, exit };
}
