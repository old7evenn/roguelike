import { Vec } from './vec';

export class Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /** Exclusive. */
  get right(): number {
    return this.x + this.width;
  }

  /** Exclusive. */
  get bottom(): number {
    return this.y + this.height;
  }

  get center(): Vec {
    return new Vec(this.x + Math.floor(this.width / 2), this.y + Math.floor(this.height / 2));
  }

  intersects(other: Rect, padding = 0): boolean {
    return (
      this.x - padding < other.right &&
      this.right + padding > other.x &&
      this.y - padding < other.bottom &&
      this.bottom + padding > other.y
    );
  }

  *positions(): IterableIterator<Vec> {
    for (let y = this.y; y < this.bottom; y++) {
      for (let x = this.x; x < this.right; x++) yield new Vec(x, y);
    }
  }
}
