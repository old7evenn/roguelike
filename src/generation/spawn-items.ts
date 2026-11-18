import type { Rng } from '../engine/rng';
import { itemsForDepth, mementoForDepth } from '../world/items';
import type { FloorItem } from '../world/stage';
import { floorAwayFromStart, type Level } from './level';

/** Scatters a few items over a finished level; rarer kinds come up less often. */
export function spawnItems(level: Level, depth: number, rng: Rng): FloorItem[] {
  // Anywhere but the start cell itself: an item next to the hero is a fine welcome.
  const freeCells = floorAwayFromStart(level, 0);
  const types = itemsForDepth(depth);
  const count = rng.int(1, 3);
  const items: FloorItem[] = [];

  for (let i = 0; i < count && freeCells.length > 0; i++) {
    const [pos] = freeCells.splice(rng.int(0, freeCells.length - 1), 1);
    items.push({ type: rng.weighted(types, (type) => type.frequency), pos });
  }

  const memento = mementoForDepth(depth);
  if (memento && freeCells.length > 0) {
    // An anchor is a reason to explore, so prefer a reachable cell well away from the entrance.
    const distant = floorAwayFromStart(level, 10).filter(
      (pos) => !items.some((item) => item.pos.equals(pos)),
    );
    const candidates = distant.length > 0 ? distant : freeCells;
    const pos = candidates[rng.int(0, candidates.length - 1)];
    if (pos) items.push({ type: memento, pos });
  }
  return items;
}
