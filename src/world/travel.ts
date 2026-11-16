import type { Array2D } from '../engine/array2d';
import { distanceMap } from '../engine/distance-map';
import { CARDINAL_DIRECTIONS, type Vec } from '../engine/vec';
import { Monster } from './monster';
import type { Stage } from './stage';

/**
 * Auto-travel for the hero: walking to a clicked cell, exploring, heading for the stairs.
 * Paths only go through cells the hero has seen, so travel never leaks the hidden map.
 * The stairs are avoided unless they are the goal: one stray step there ends the floor.
 */

/** The direction of the first step on a shortest path to `goal`, or null if there is none. */
export function stepToward(stage: Stage, from: Vec, goal: Vec): Vec | null {
  if (from.equals(goal) || !isKnownFloor(stage, goal)) return null;
  const toGoal = distanceMap(stage.width, stage.height, goal, (pos) => isTravelable(stage, pos, goal));
  const here = toGoal.get(from);
  return (
    CARDINAL_DIRECTIONS.find((direction) => {
      const next = from.add(direction);
      return toGoal.contains(next) && toGoal.get(next) < here;
    }) ?? null
  );
}

/**
 * Where exploring should go next: the nearest item in sight, otherwise the nearest
 * seen floor cell that borders unexplored space. Null once the floor is fully explored.
 */
export function exploreTarget(stage: Stage, from: Vec): Vec | null {
  const fromHero = distanceMap(stage.width, stage.height, from, (pos) => isTravelable(stage, pos, from));
  const items = stage.items.filter((item) => stage.isVisible(item.pos)).map((item) => item.pos);
  const frontier = [...stage.tiles.entries()]
    .map(([pos]) => pos)
    .filter((pos) => isTravelable(stage, pos, from) && bordersUnexplored(stage, pos));
  return nearest(items, fromHero) ?? nearest(frontier, fromHero);
}

/** The stairs down, if the hero has already seen them. */
export function knownExit(stage: Stage): Vec | null {
  for (const [pos, tile] of stage.tiles.entries()) {
    if (tile.isExit && stage.isExplored(pos)) return pos;
  }
  return null;
}

/** Monsters the hero can see right now, nearest first. */
export function visibleMonsters(stage: Stage, from: Vec): Monster[] {
  const distance = (monster: Monster) => Math.abs(monster.pos.x - from.x) + Math.abs(monster.pos.y - from.y);
  return stage.actors
    .filter((actor): actor is Monster => actor instanceof Monster && stage.isVisible(actor.pos))
    .sort((a, b) => distance(a) - distance(b));
}

function isKnownFloor(stage: Stage, pos: Vec): boolean {
  return stage.isExplored(pos) && stage.isWalkable(pos);
}

function isTravelable(stage: Stage, pos: Vec, goal: Vec): boolean {
  return isKnownFloor(stage, pos) && (!stage.tileAt(pos).isExit || pos.equals(goal));
}

function bordersUnexplored(stage: Stage, pos: Vec): boolean {
  return CARDINAL_DIRECTIONS.some((direction) => {
    const neighbor = pos.add(direction);
    return stage.tiles.contains(neighbor) && !stage.isExplored(neighbor);
  });
}

function nearest(candidates: Vec[], distances: Array2D<number>): Vec | null {
  let best: Vec | null = null;
  for (const pos of candidates) {
    const distance = distances.get(pos);
    if (distance > 0 && Number.isFinite(distance) && (!best || distance < distances.get(best))) best = pos;
  }
  return best;
}
