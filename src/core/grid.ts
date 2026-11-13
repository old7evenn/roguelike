/**
 * Карта поверху — двовимірна сітка тайлів.
 * Зберігаємо її в одному плоскому Uint8Array: індекс = y * width + x.
 * Це компактніше і швидше за масив масивів, а типізований масив
 * гарантує, що кожна клітинка — це один байт.
 */

// const-об'єкт замість enum: працює з erasableSyntaxOnly і дає ті самі типи.
export const Tile = {
  Wall: 0,
  Floor: 1,
  Stairs: 2,
} as const;
export type Tile = (typeof Tile)[keyof typeof Tile];

export interface Point {
  x: number;
  y: number;
}

export class Grid {
  readonly width: number;
  readonly height: number;
  readonly cells: Uint8Array;

  constructor(width: number, height: number, fill: Tile = Tile.Wall) {
    this.width = width;
    this.height = height;
    this.cells = new Uint8Array(width * height).fill(fill);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  index(x: number, y: number): number {
    return y * this.width + x;
  }

  /** За межами карти завжди «стіна» — так алгоритмам не треба окремо перевіряти краї. */
  get(x: number, y: number): Tile {
    return this.inBounds(x, y) ? (this.cells[this.index(x, y)] as Tile) : Tile.Wall;
  }

  set(x: number, y: number, tile: Tile): void {
    if (this.inBounds(x, y)) this.cells[this.index(x, y)] = tile;
  }

  isWalkable(x: number, y: number): boolean {
    const t = this.get(x, y);
    return t === Tile.Floor || t === Tile.Stairs;
  }
}

/** 4 напрямки руху: вправо, вліво, вниз, вгору. */
export const DIRS4: readonly Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}
