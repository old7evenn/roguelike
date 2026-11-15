import { Array2D } from '../engine/array2d';
import { fieldOfView } from '../engine/field-of-view';
import type { Vec } from '../engine/vec';
import type { Actor } from './actor';
import type { ItemType } from './items';
import { Tiles, type TileType } from './tile';

export interface FloorItem {
  readonly type: ItemType;
  readonly pos: Vec;
}

/** The current floor: its tiles and what is on it. */
export class Stage {
  readonly tiles: Array2D<TileType>;
  readonly actors: Actor[] = [];
  readonly items: FloorItem[] = [];
  /** Cells the hero sees right now. */
  private visible: Array2D<boolean>;
  /** Cells the hero has ever seen: the map they remember (fog of war). */
  private readonly explored: Array2D<boolean>;

  constructor(tiles: Array2D<TileType>) {
    this.tiles = tiles;
    this.visible = new Array2D(tiles.width, tiles.height, false);
    this.explored = new Array2D(tiles.width, tiles.height, false);
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

  refreshView(origin: Vec, radius: number): void {
    this.visible = fieldOfView(
      this.width,
      this.height,
      origin,
      radius,
      (pos) => !this.tileAt(pos).isTransparent,
    );
    for (const [pos, isVisible] of this.visible.entries()) {
      if (isVisible) this.explored.set(pos, true);
    }
  }

  isVisible(pos: Vec): boolean {
    return this.visible.contains(pos) && this.visible.get(pos);
  }

  isExplored(pos: Vec): boolean {
    return this.explored.contains(pos) && this.explored.get(pos);
  }

  addActor(actor: Actor): void {
    this.actors.push(actor);
  }

  removeActor(actor: Actor): void {
    const index = this.actors.indexOf(actor);
    if (index !== -1) this.actors.splice(index, 1);
  }

  actorAt(pos: Vec): Actor | undefined {
    return this.actors.find((actor) => actor.pos.equals(pos));
  }

  addItem(item: FloorItem): void {
    this.items.push(item);
  }

  removeItem(item: FloorItem): void {
    const index = this.items.indexOf(item);
    if (index !== -1) this.items.splice(index, 1);
  }

  itemAt(pos: Vec): FloorItem | undefined {
    return this.items.find((item) => item.pos.equals(pos));
  }
}
