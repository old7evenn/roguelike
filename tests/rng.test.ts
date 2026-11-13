import { describe, expect, it } from 'vitest';
import { createRng, deriveSeed, seedFromString } from '../src/core/rng';

describe('rng', () => {
  it('the same seed gives the same sequence', () => {
    const a = createRng(1234);
    const b = createRng(1234);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('different seeds give different sequences', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('int() stays inside [min, max] and hits both ends', () => {
    const rng = createRng(42);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const n = rng.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      seen.add(n);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
  });

  it('deriveSeed gives different floor seeds per floor', () => {
    const seeds = new Set(Array.from({ length: 10 }, (_, i) => deriveSeed(1234, i + 1)));
    expect(seeds.size).toBe(10);
  });

  it('seedFromString parses numbers and hashes text', () => {
    expect(seedFromString('1234')).toBe(1234);
    expect(seedFromString('kyiv')).toBe(seedFromString('kyiv'));
    expect(seedFromString('kyiv')).not.toBe(seedFromString('lviv'));
  });
});
