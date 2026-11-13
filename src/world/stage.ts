import type { Array2D } from '../engine/array2d';
import type { Vec } from '../engine/vec';
import type { Actor } from './actor';
import { Tiles, type TileType } from './tile';

/** The current floor: its tiles and the actors on it. */
export class Stage {
  readonly tiles: Array2D<TileType>;
  readonly actors: Actor[] = [];

  constructor(tiles: Array2D<TileType>) {
    this.tiles = tiles;
  }

  get width(): number {
    return this.tiles.width;
  }

  get height(): number {
    return this.tiles.height;
  }

  /** Everything outside the map is solid rock, so callers never bounds-check. */
  tileAt(pos: Vec): TileType {
    return this.tiles.contains(pos) ? this.tiles.get(pos) : Tiles.wall;
  }

  isWalkable(pos: Vec): boolean {
    return this.tileAt(pos).isWalkable;
  }

  addActor(actor: Actor): void {
    this.actors.push(actor);
  }
}
