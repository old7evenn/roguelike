import type { Array2D } from '../engine/array2d';
import type { Rng } from '../engine/rng';
import type { Vec } from '../engine/vec';
import type { TileType } from '../world/tile';

export interface GeneratedMap {
  tiles: Array2D<TileType>;
  start: Vec;
}

/**
 * Strategy pattern: the game depends on this interface only, and
 * `generatorForDepth` picks rooms or caves per floor without the game knowing which.
 */
export interface DungeonGenerator {
  generate(rng: Rng): GeneratedMap;
}
