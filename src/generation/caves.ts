import { config } from '../config';
import { Array2D } from '../engine/array2d';
import type { Rng } from '../engine/rng';
import { ALL_DIRECTIONS, CARDINAL_DIRECTIONS, type Vec } from '../engine/vec';
import { Tiles, type TileType } from '../world/tile';
import type { DungeonGenerator, GeneratedMap } from './dungeon-generator';

export interface CavesOptions {
  width: number;
  height: number;
  /** Share of cells that start as rock before smoothing. */
  initialWallChance: number;
  smoothingSteps: number;
  /** The cave must take up at least this share of the map, or it is regenerated. */
  minOpenShare: number;
}

const DEFAULTS: CavesOptions = {
  width: config.stageWidth,
  height: config.stageHeight,
  initialWallChance: 0.5,
  smoothingSteps: 4,
  minOpenShare: 0.3,
};

/**
 * Cellular automata caves: start from random noise, then repeatedly let every
 * cell take the majority of its 8 neighbours. Noise clumps into rounded caverns.
 * Smoothing can leave isolated pockets, so only the largest connected cave is
 * kept and the rest is filled with rock; that is what rules out softlocks here.
 */
export class Caves implements DungeonGenerator {
  private readonly options: CavesOptions;

  constructor(options: Partial<CavesOptions> = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  generate(rng: Rng): GeneratedMap {
    const { width, height, smoothingSteps, minOpenShare } = this.options;
    // A cave that came out too cramped is thrown away. Each retry continues the
    // same seeded stream, so the result is still fully determined by the seed.
    for (;;) {
      let tiles = this.noise(rng);
      for (let step = 0; step < smoothingSteps; step++) tiles = smooth(tiles);

      const cave = largestRegion(tiles);
      if (cave.length < width * height * minOpenShare) continue;

      const filled = new Array2D<TileType>(width, height, Tiles.wall);
      for (const pos of cave) filled.set(pos, Tiles.floor);
      return { tiles: filled, start: rng.pick(cave) };
    }
  }

  private noise(rng: Rng): Array2D<TileType> {
    const { width, height, initialWallChance } = this.options;
    const tiles = new Array2D<TileType>(width, height, Tiles.wall);
    for (const [pos] of tiles.entries()) {
      // The border stays rock, so the cave never touches the edge of the map.
      if (!isOnBorder(tiles, pos) && !rng.chance(initialWallChance)) tiles.set(pos, Tiles.floor);
    }
    return tiles;
  }
}

/** The 4-5 rule: 5+ rock neighbours turn a cell to rock, 3 or fewer to floor, 4 keeps it. */
function smooth(tiles: Array2D<TileType>): Array2D<TileType> {
  const next = new Array2D<TileType>(tiles.width, tiles.height, Tiles.wall);
  for (const [pos, tile] of tiles.entries()) {
    if (isOnBorder(tiles, pos)) continue;

    const rock = rockNeighbours(tiles, pos);
    if (rock >= 5) next.set(pos, Tiles.wall);
    else if (rock <= 3) next.set(pos, Tiles.floor);
    else next.set(pos, tile);
  }
  return next;
}

function isOnBorder(tiles: Array2D<TileType>, pos: Vec): boolean {
  return pos.x === 0 || pos.y === 0 || pos.x === tiles.width - 1 || pos.y === tiles.height - 1;
}

function rockNeighbours(tiles: Array2D<TileType>, pos: Vec): number {
  return ALL_DIRECTIONS.filter((direction) => {
    const neighbour = pos.add(direction);
    return !tiles.contains(neighbour) || !tiles.get(neighbour).isWalkable;
  }).length;
}

/** Flood-fills every open region and returns the cells of the biggest one. */
function largestRegion(tiles: Array2D<TileType>): Vec[] {
  // Shared by all regions, so each cell is visited once in total, not once per region.
  const seen = new Array2D(tiles.width, tiles.height, false);
  let largest: Vec[] = [];

  for (const [pos, tile] of tiles.entries()) {
    if (!tile.isWalkable || seen.get(pos)) continue;
    const region = floodFill(tiles, pos, seen);
    if (region.length > largest.length) largest = region;
  }
  // Row-major order, so the seeded `rng.pick` of a start cell doesn't depend on how the fill walked.
  return largest.sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Breadth-first walk over the open cells connected to `origin`; the result doubles as the queue. */
function floodFill(tiles: Array2D<TileType>, origin: Vec, seen: Array2D<boolean>): Vec[] {
  seen.set(origin, true);
  const region = [origin];
  for (let head = 0; head < region.length; head++) {
    const current = region[head] as Vec;
    for (const direction of CARDINAL_DIRECTIONS) {
      const next = current.add(direction);
      if (!tiles.contains(next) || seen.get(next) || !tiles.get(next).isWalkable) continue;
      seen.set(next, true);
      region.push(next);
    }
  }
  return region;
}
