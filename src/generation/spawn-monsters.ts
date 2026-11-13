import { distanceMap } from '../engine/distance-map';
import type { Rng } from '../engine/rng';
import type { Vec } from '../engine/vec';
import { breedsForDepth } from '../world/breeds';
import { Monster } from '../world/monster';
import { Tiles } from '../world/tile';
import type { Level } from './level';

/** No monster starts this close (in steps) to the hero, so a floor never opens with a fight. */
export const SAFE_RADIUS = 8;

/** Places monsters on a finished level. More of them, and of stronger breeds, the deeper it is. */
export function spawnMonsters(level: Level, depth: number, rng: Rng): Monster[] {
  const { tiles, start } = level;
  const fromStart = distanceMap(tiles.width, tiles.height, start, (pos) => tiles.get(pos).isWalkable);

  const freeCells: Vec[] = [];
  for (const [pos, tile] of tiles.entries()) {
    const distance = fromStart.get(pos);
    if (tile === Tiles.floor && Number.isFinite(distance) && distance > SAFE_RADIUS) freeCells.push(pos);
  }

  const breeds = breedsForDepth(depth);
  const count = rng.int(2, 4) + Math.floor(depth / 2);
  const monsters: Monster[] = [];

  for (let i = 0; i < count && freeCells.length > 0; i++) {
    // Removing the chosen cell keeps two monsters from sharing it.
    const [pos] = freeCells.splice(rng.int(0, freeCells.length - 1), 1);
    monsters.push(new Monster(rng.pick(breeds), pos));
  }
  return monsters;
}
