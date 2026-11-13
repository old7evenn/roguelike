import { Vec } from './vec';

/** Fixed-size grid stored row-major in a flat array. */
export class Array2D<T> {
  readonly width: number;
  readonly height: number;
  private readonly cells: T[];

  constructor(width: number, height: number, fill: T) {
    this.width = width;
    this.height = height;
    this.cells = new Array<T>(width * height).fill(fill);
  }

  contains(pos: Vec): boolean {
    return pos.x >= 0 && pos.y >= 0 && pos.x < this.width && pos.y < this.height;
  }

  get(pos: Vec): T {
    return this.cells[this.indexOf(pos)] as T;
  }

  set(pos: Vec, value: T): void {
    this.cells[this.indexOf(pos)] = value;
  }

  *entries(): IterableIterator<[Vec, T]> {
    for (let i = 0; i < this.cells.length; i++) {
      yield [new Vec(i % this.width, Math.floor(i / this.width)), this.cells[i] as T];
    }
  }

  values(): T[] {
    return [...this.cells];
  }

  private indexOf(pos: Vec): number {
    if (!this.contains(pos)) {
      throw new RangeError(`${pos} is outside ${this.width}x${this.height}`);
    }
    return pos.y * this.width + pos.x;
  }
}
