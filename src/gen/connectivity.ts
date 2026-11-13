import { DIRS4, Grid, type Point } from '../core/grid';

/**
 * Пошук у ширину (BFS) від точки `from` по прохідних клітинках.
 * Повертає відстань (у кроках) до кожної клітинки; -1 означає «недосяжна».
 *
 * Використовуємо для двох речей:
 *  1) поставити сходи якнайдалі від гравця;
 *  2) перевірити, що поверх зв'язний (немає «softlock»: гравець не застрягне).
 */
export function bfsDistances(grid: Grid, from: Point): Int32Array {
  const dist = new Int32Array(grid.width * grid.height).fill(-1);
  if (!grid.isWalkable(from.x, from.y)) return dist;

  // Черга на масиві з «головою»: shift() був би O(n) на кожен крок.
  const queue: number[] = [grid.index(from.x, from.y)];
  dist[queue[0]!] = 0;

  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]!;
    const cx = cur % grid.width;
    const cy = Math.floor(cur / grid.width);
    for (const d of DIRS4) {
      const nx = cx + d.x;
      const ny = cy + d.y;
      if (!grid.isWalkable(nx, ny)) continue;
      const ni = grid.index(nx, ny);
      if (dist[ni] !== -1) continue;
      dist[ni] = dist[cur]! + 1;
      queue.push(ni);
    }
  }
  return dist;
}

/** Найвіддаленіша досяжна клітинка за результатом BFS. */
export function farthestPoint(grid: Grid, dist: Int32Array): Point {
  let best = 0;
  for (let i = 1; i < dist.length; i++) {
    if (dist[i]! > dist[best]!) best = i;
  }
  return { x: best % grid.width, y: Math.floor(best / grid.width) };
}

/** Чи всі прохідні клітинки досяжні з `from`. */
export function isFullyConnected(grid: Grid, from: Point): boolean {
  const dist = bfsDistances(grid, from);
  for (let i = 0; i < grid.cells.length; i++) {
    const x = i % grid.width;
    const y = Math.floor(i / grid.width);
    if (grid.isWalkable(x, y) && dist[i] === -1) return false;
  }
  return true;
}
