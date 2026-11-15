import { describe, expect, it } from 'vitest';
import { distanceMap } from '../src/engine/distance-map';
import { Rng } from '../src/engine/rng';
import { Caves } from '../src/generation/caves';
import { generatorForDepth } from '../src/generation/generator-for-depth';
import { buildLevel, type Level } from '../src/generation/level';
import { RoomsAndCorridors } from '../src/generation/rooms-and-corridors';
import { Tiles } from '../src/world/tile';

function distancesFromStart({ tiles, start }: Level) {
  return distanceMap(tiles.width, tiles.height, start, (pos) => tiles.get(pos).isWalkable);
}

/** These tests generate hundreds of maps; a CI runner is about twice as slow as a laptop. */
const MANY_MAPS_TIMEOUT = 30_000;

const generators = [
  { name: 'RoomsAndCorridors', generator: new RoomsAndCorridors() },
  { name: 'Caves', generator: new Caves() },
];

describe.each(generators)('buildLevel with $name', ({ generator }) => {
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

  it(
    'never softlocks: every walkable cell and the exit are reachable (500 seeds)',
    () => {
      for (let seed = 0; seed < 500; seed++) {
        const level = buildLevel(generator, seed);
        const distances = distancesFromStart(level);

        expect(level.tiles.get(level.start)).toBe(Tiles.floor);
        expect(level.tiles.get(level.exit)).toBe(Tiles.stairsDown);
        expect(distances.get(level.exit)).toBeGreaterThan(0);

        // One expect per seed, not per cell: hundreds of thousands of expects make the test slow.
        const unreachable = [...level.tiles.entries()]
          .filter(([pos, tile]) => tile.isWalkable && !Number.isFinite(distances.get(pos)))
          .map(([pos]) => `${pos}`);
        expect(unreachable, `seed ${seed}`).toEqual([]);
      }
    },
    MANY_MAPS_TIMEOUT,
  );

  it(
    'keeps a solid border around the map',
    () => {
      for (let seed = 0; seed < 200; seed++) {
        const { tiles } = buildLevel(generator, seed);
        const openBorder = [...tiles.entries()]
          .filter(([pos, tile]) => {
            const onBorder =
              pos.x === 0 || pos.y === 0 || pos.x === tiles.width - 1 || pos.y === tiles.height - 1;
            return onBorder && tile !== Tiles.wall;
          })
          .map(([pos]) => `${pos}`);
        expect(openBorder, `seed ${seed}`).toEqual([]);
      }
    },
    MANY_MAPS_TIMEOUT,
  );
});

describe('Caves', () => {
  it('opens up at least the required share of the map', () => {
    const caves = new Caves({ minOpenShare: 0.3 });
    for (let seed = 0; seed < 100; seed++) {
      const { tiles } = caves.generate(new Rng(seed));
      const open = tiles.values().filter((tile) => tile.isWalkable).length;
      expect(open).toBeGreaterThanOrEqual(tiles.width * tiles.height * 0.3);
    }
  });
});

describe('generatorForDepth', () => {
  it('starts with rooms, mixes in caves deeper, and ends in a cave', () => {
    const kinds = Array.from({ length: 10 }, (_, i) =>
      generatorForDepth(i + 1) instanceof Caves ? 'caves' : 'rooms',
    );
    expect(kinds.slice(0, 3)).toEqual(['rooms', 'rooms', 'rooms']);
    expect(kinds).toContain('caves');
    expect(kinds.at(-1)).toBe('caves');
  });
});
