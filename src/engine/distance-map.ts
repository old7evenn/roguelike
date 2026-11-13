import { Array2D } from './array2d';
import { CARDINAL_DIRECTIONS, type Vec } from './vec';

/**
 * Breadth-first flood fill: number of steps from `origin` to every reachable cell,
 * `Infinity` where unreachable. Also usable as a flow field for monster pursuit.
 */
export function distanceMap(
  width: number,
  height: number,
  origin: Vec,
  isPassable: (pos: Vec) => boolean,
): Array2D<number> {
  const distances = new Array2D(width, height, Number.POSITIVE_INFINITY);
  if (!distances.contains(origin) || !isPassable(origin)) return distances;

  distances.set(origin, 0);
  const queue: Vec[] = [origin];

  // Index-based dequeue: Array#shift() is O(n).
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head] as Vec;
    const nextDistance = distances.get(current) + 1;

    for (const direction of CARDINAL_DIRECTIONS) {
      const neighbor = current.add(direction);
      if (!distances.contains(neighbor) || !isPassable(neighbor)) continue;
      if (distances.get(neighbor) !== Number.POSITIVE_INFINITY) continue;

      distances.set(neighbor, nextDistance);
      queue.push(neighbor);
    }
  }
  return distances;
}

export function farthestReachable(distances: Array2D<number>): Vec {
  let best: Vec | null = null;
  let bestDistance = -1;
  for (const [pos, distance] of distances.entries()) {
    if (Number.isFinite(distance) && distance > bestDistance) {
      best = pos;
      bestDistance = distance;
    }
  }
  if (!best) throw new Error('No reachable cells');
  return best;
}
