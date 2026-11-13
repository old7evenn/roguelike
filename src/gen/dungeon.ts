import { createRng, type Rng } from '../core/rng';
import { Grid, Tile, type Point } from '../core/grid';
import { bfsDistances, farthestPoint } from './connectivity';

/**
 * Генератор поверху: «кімнати + коридори» (класичний алгоритм з Rogue, 1980).
 *
 *  1. Заповнюємо всю карту стінами.
 *  2. Пробуємо поставити прямокутну кімнату випадкового розміру у випадковому місці.
 *     Якщо вона перетинається з уже існуючою — відкидаємо спробу.
 *  3. Кожну нову кімнату з'єднуємо L-подібним коридором з попередньою.
 *     Тому всі кімнати гарантовано зв'язні (це ланцюжок).
 *  4. Гравець стартує в центрі першої кімнати, сходи — у найдальшій
 *     досяжній клітинці (BFS), щоб поверх треба було «пройти».
 *
 * Пізніше (рівень Advanced) цей файл можна замінити на BSP-дерево,
 * cellular automata для печер або Wave Function Collapse.
 */

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Floor {
  grid: Grid;
  rooms: Room[];
  start: Point;
  stairs: Point;
}

export interface GenOptions {
  width: number;
  height: number;
  maxRooms: number;
  minRoomSize: number;
  maxRoomSize: number;
}

export const DEFAULT_GEN: GenOptions = {
  width: 64,
  height: 36,
  maxRooms: 14,
  minRoomSize: 4,
  maxRoomSize: 10,
};

export function generateFloor(seed: number, opts: GenOptions = DEFAULT_GEN): Floor {
  const rng = createRng(seed);
  const grid = new Grid(opts.width, opts.height, Tile.Wall);
  const rooms: Room[] = [];

  const attempts = opts.maxRooms * 10;
  for (let i = 0; i < attempts && rooms.length < opts.maxRooms; i++) {
    const w = rng.int(opts.minRoomSize, opts.maxRoomSize);
    const h = rng.int(opts.minRoomSize, Math.max(opts.minRoomSize, opts.maxRoomSize - 3));
    // Відступ 1 від краю: зовнішній периметр карти завжди стіна.
    const x = rng.int(1, opts.width - w - 1);
    const y = rng.int(1, opts.height - h - 1);
    const room: Room = { x, y, w, h };

    if (rooms.some((other) => intersects(room, other, 1))) continue;

    carveRoom(grid, room);
    const prev = rooms.at(-1);
    if (prev) carveCorridor(grid, rng, center(prev), center(room));
    rooms.push(room);
  }

  // Перша спроба завжди вдала (кімнат ще немає), тож rooms[0] існує.
  const start = center(rooms[0]!);
  const stairs = farthestPoint(grid, bfsDistances(grid, start));
  grid.set(stairs.x, stairs.y, Tile.Stairs);

  return { grid, rooms, start, stairs };
}

/** Перетин прямокутників з урахуванням відступу `pad` (щоб між кімнатами лишалась стіна). */
export function intersects(a: Room, b: Room, pad = 0): boolean {
  return (
    a.x - pad < b.x + b.w &&
    a.x + a.w + pad > b.x &&
    a.y - pad < b.y + b.h &&
    a.y + a.h + pad > b.y
  );
}

export function center(r: Room): Point {
  return { x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) };
}

function carveRoom(grid: Grid, r: Room): void {
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) grid.set(x, y, Tile.Floor);
  }
}

/** L-подібний коридор: спершу по горизонталі, потім по вертикалі (або навпаки — випадково). */
function carveCorridor(grid: Grid, rng: Rng, a: Point, b: Point): void {
  if (rng.chance(0.5)) {
    carveH(grid, a.x, b.x, a.y);
    carveV(grid, a.y, b.y, b.x);
  } else {
    carveV(grid, a.y, b.y, a.x);
    carveH(grid, a.x, b.x, b.y);
  }
}

function carveH(grid: Grid, x1: number, x2: number, y: number): void {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) grid.set(x, y, Tile.Floor);
}

function carveV(grid: Grid, y1: number, y2: number, x: number): void {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) grid.set(x, y, Tile.Floor);
}
