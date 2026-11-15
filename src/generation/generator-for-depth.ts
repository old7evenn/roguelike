import { Caves } from './caves';
import type { DungeonGenerator } from './dungeon-generator';
import { RoomsAndCorridors } from './rooms-and-corridors';

const rooms = new RoomsAndCorridors();
const caves = new Caves();

/**
 * The first floors are tidy rooms. From depth 4 on, the deeper the hero goes
 * the messier their head gets, so caves alternate with rooms; the last floor
 * is always a cave, a wide arena for the final fight.
 */
export function generatorForDepth(depth: number): DungeonGenerator {
  return depth >= 4 && depth % 2 === 0 ? caves : rooms;
}
