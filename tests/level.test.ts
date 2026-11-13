import { describe, expect, it } from 'vitest';
import { distanceMap } from '../src/engine/distance-map';
import { buildLevel, type Level } from '../src/generation/level';
import { RoomsAndCorridors } from '../src/generation/rooms-and-corridors';
import { Tiles } from '../src/world/tile';

const generator = new RoomsAndCorridors();

function distancesFromStart({ tiles, start }: Level) {
  return distanceMap(tiles.width, tiles.height, start, (pos) => tiles.get(pos).isWalkable);
}

describe('buildLevel', () => {
  it('is deterministic for a given seed', () => {
    const a = buildLevel(generator, 1234);
    const b = buildLevel(generator, 1234);
    expect(a.tiles.values()).toEqual(b.tiles.values());
    expect(a.start).toEqual(b.start);
    expect(a.exit).toEqual(b.exit);
  });

  it('differs between seeds', () => {
    expect(buildLevel(generator, 1).tiles.values()).not.toEqual(buildLevel(generator, 2).tiles.values());
  });

  it('never softlocks: every walkable cell and the exit are reachable (1000 seeds)', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const level = buildLevel(generator, seed);
      const distances = distancesFromStart(level);

      expect(level.tiles.get(level.start)).toBe(Tiles.floor);
      expect(level.tiles.get(level.exit)).toBe(Tiles.stairsDown);
      expect(distances.get(level.exit)).toBeGreaterThan(0);

      for (const [pos, tile] of level.tiles.entries()) {
        if (tile.isWalkable) expect(distances.get(pos), `seed ${seed} at ${pos}`).not.toBe(Infinity);
      }
    }
  });

  it('keeps a solid border around the map', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { tiles } = buildLevel(generator, seed);
      for (const [pos, tile] of tiles.entries()) {
        const onBorder =
          pos.x === 0 || pos.y === 0 || pos.x === tiles.width - 1 || pos.y === tiles.height - 1;
        if (onBorder) expect(tile).toBe(Tiles.wall);
      }
    }
  });
});
