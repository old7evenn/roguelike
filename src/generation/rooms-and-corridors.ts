import { config } from '../config';
import { Array2D } from '../engine/array2d';
import { Rect } from '../engine/rect';
import type { Rng } from '../engine/rng';
import { Vec } from '../engine/vec';
import { Tiles, type TileType } from '../world/tile';
import type { DungeonGenerator, GeneratedMap } from './dungeon-generator';

export interface RoomsAndCorridorsOptions {
  width: number;
  height: number;
  maxRooms: number;
  minRoomSize: number;
  maxRoomSize: number;
}

const DEFAULTS: RoomsAndCorridorsOptions = {
  width: config.stageWidth,
  height: config.stageHeight,
  maxRooms: 14,
  minRoomSize: 4,
  maxRoomSize: 10,
};

/**
 * The classic Rogue (1980) layout: scatter non-overlapping rooms, then join each
 * new room to the previous one with an L-shaped corridor. Chaining guarantees
 * every room is reachable.
 */
export class RoomsAndCorridors implements DungeonGenerator {
  private readonly options: RoomsAndCorridorsOptions;

  constructor(options: Partial<RoomsAndCorridorsOptions> = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  generate(rng: Rng): GeneratedMap {
    const { width, height, maxRooms } = this.options;
    const tiles = new Array2D<TileType>(width, height, Tiles.wall);
    const rooms: Rect[] = [];

    for (let attempt = 0; attempt < maxRooms * 10 && rooms.length < maxRooms; attempt++) {
      const room = this.randomRoom(rng);
      // Padding of 1 keeps a wall between neighbouring rooms.
      if (rooms.some((other) => room.intersects(other, 1))) continue;

      carve(tiles, room.positions());
      const previous = rooms.at(-1);
      if (previous) carve(tiles, corridor(rng, previous.center, room.center));
      rooms.push(room);
    }

    // The first attempt always succeeds because there is nothing to overlap yet.
    const firstRoom = rooms[0] as Rect;
    return { tiles, start: firstRoom.center };
  }

  private randomRoom(rng: Rng): Rect {
    const { width, height, minRoomSize, maxRoomSize } = this.options;
    const roomWidth = rng.int(minRoomSize, maxRoomSize);
    // The map is wider than it is tall, so rooms are kept a bit shorter too.
    const roomHeight = rng.int(minRoomSize, Math.max(minRoomSize, maxRoomSize - 3));
    // Leave a 1-cell solid border around the map.
    const x = rng.int(1, width - roomWidth - 1);
    const y = rng.int(1, height - roomHeight - 1);
    return new Rect(x, y, roomWidth, roomHeight);
  }
}

function carve(tiles: Array2D<TileType>, positions: Iterable<Vec>): void {
  for (const pos of positions) tiles.set(pos, Tiles.floor);
}

function* corridor(rng: Rng, from: Vec, to: Vec): IterableIterator<Vec> {
  const corner = rng.chance(0.5) ? new Vec(to.x, from.y) : new Vec(from.x, to.y);
  yield* straightLine(from, corner);
  yield* straightLine(corner, to);
}

function* straightLine(from: Vec, to: Vec): IterableIterator<Vec> {
  const stepX = Math.sign(to.x - from.x);
  const stepY = Math.sign(to.y - from.y);
  let pos = from;
  yield pos;
  while (!pos.equals(to)) {
    pos = new Vec(pos.x + stepX, pos.y + stepY);
    yield pos;
  }
}
