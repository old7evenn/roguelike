import { describe, expect, it } from 'vitest';
import { deriveSeed, Rng, seedFromString } from '../src/engine/rng';

describe('Rng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    for (let i = 0; i < 100; i++) expect(a.float()).toBe(b.float());
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const take = (rng: Rng) => Array.from({ length: 10 }, () => rng.float());
    expect(take(a)).not.toEqual(take(b));
  });

  it('int() covers [min, max] inclusively and nothing else', () => {
    const rng = new Rng(42);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(rng.int(3, 7));
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
  });
});

describe('Rng.weighted', () => {
  it('picks in proportion to weight and never picks weight 0', () => {
    const rng = new Rng(7);
    const counts = { a: 0, b: 0, never: 0 };
    const weights = { a: 1, b: 3, never: 0 };
    const keys = Object.keys(weights) as (keyof typeof weights)[];
    for (let i = 0; i < 4000; i++) counts[rng.weighted(keys, (key) => weights[key])]++;

    expect(counts.never).toBe(0);
    expect(counts.b / counts.a).toBeGreaterThan(2.5);
    expect(counts.b / counts.a).toBeLessThan(3.5);
  });

  it('throws on an empty list', () => {
    expect(() => new Rng(1).weighted([], () => 1)).toThrow(RangeError);
  });
});

describe('deriveSeed', () => {
  it('gives every depth its own seed', () => {
    const seeds = new Set(Array.from({ length: 10 }, (_, depth) => deriveSeed(1234, depth + 1)));
    expect(seeds.size).toBe(10);
  });
});

describe('seedFromString', () => {
  it('uses numbers as-is and hashes text stably', () => {
    expect(seedFromString('1234')).toBe(1234);
    expect(seedFromString('kyiv')).toBe(seedFromString('kyiv'));
    expect(seedFromString('kyiv')).not.toBe(seedFromString('lviv'));
  });
});
