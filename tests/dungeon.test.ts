import { describe, expect, it } from 'vitest';
import { Tile, samePoint } from '../src/core/grid';
import { bfsDistances, isFullyConnected } from '../src/gen/connectivity';
import { DEFAULT_GEN, generateFloor, intersects } from '../src/gen/dungeon';

describe('generateFloor', () => {
  it('is deterministic: same seed → identical map', () => {
    const a = generateFloor(1234);
    const b = generateFloor(1234);
    expect(a.grid.cells).toEqual(b.grid.cells);
    expect(a.start).toEqual(b.start);
    expect(a.stairs).toEqual(b.stairs);
  });

  it('different seeds → different maps', () => {
    expect(generateFloor(1).grid.cells).not.toEqual(generateFloor(2).grid.cells);
  });

  // «Softlock»-тест: на 1000 сидах гравець завжди може дійти до сходів.
  it('every floor is connected and the stairs are reachable (1000 seeds)', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const floor = generateFloor(seed);
      const { grid, start, stairs } = floor;

      expect(grid.get(start.x, start.y)).toBe(Tile.Floor);
      expect(grid.get(stairs.x, stairs.y)).toBe(Tile.Stairs);
      expect(samePoint(start, stairs)).toBe(false);
      expect(isFullyConnected(grid, start)).toBe(true);

      const dist = bfsDistances(grid, start);
      expect(dist[grid.index(stairs.x, stairs.y)]).toBeGreaterThan(0);
    }
  });

  it('keeps the map border solid and rooms non-overlapping', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { grid, rooms } = generateFloor(seed);
      for (let x = 0; x < DEFAULT_GEN.width; x++) {
        expect(grid.get(x, 0)).toBe(Tile.Wall);
        expect(grid.get(x, DEFAULT_GEN.height - 1)).toBe(Tile.Wall);
      }
      for (let y = 0; y < DEFAULT_GEN.height; y++) {
        expect(grid.get(0, y)).toBe(Tile.Wall);
        expect(grid.get(DEFAULT_GEN.width - 1, y)).toBe(Tile.Wall);
      }
      for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
          expect(intersects(rooms[i]!, rooms[j]!)).toBe(false);
        }
      }
      expect(rooms.length).toBeGreaterThanOrEqual(2);
    }
  });
});
