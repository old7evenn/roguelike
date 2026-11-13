export class Vec {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(other: Vec): Vec {
    return new Vec(this.x + other.x, this.y + other.y);
  }

  equals(other: Vec): boolean {
    return this.x === other.x && this.y === other.y;
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}

export const Direction = {
  north: new Vec(0, -1),
  south: new Vec(0, 1),
  east: new Vec(1, 0),
  west: new Vec(-1, 0),
  northEast: new Vec(1, -1),
  northWest: new Vec(-1, -1),
  southEast: new Vec(1, 1),
  southWest: new Vec(-1, 1),
} as const;

export const CARDINAL_DIRECTIONS: readonly Vec[] = [
  Direction.north,
  Direction.south,
  Direction.east,
  Direction.west,
];

export const ALL_DIRECTIONS: readonly Vec[] = Object.values(Direction);
