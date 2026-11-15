import { describe, expect, it } from 'vitest';
import { playBot, summarize } from './bot';

/** `npm run balance` sets a bigger sample; the regular suite keeps it quick. */
const RUNS = Number(import.meta.env.BALANCE_RUNS ?? 20);

describe('balance', () => {
  it(`is beatable but not trivial for a simple bot (${RUNS} seeds)`, () => {
    const runs = Array.from({ length: RUNS }, (_, i) => playBot(i + 1));
    console.info(summarize(runs));

    const winRate = runs.filter((run) => run.status === 'won').length / RUNS;
    expect(runs.every((run) => run.status !== 'stuck')).toBe(true);
    expect(winRate).toBeGreaterThanOrEqual(0.15);
    expect(winRate).toBeLessThanOrEqual(0.8);
  }, 600_000);

  it('plays the same run for the same seed', () => {
    expect(playBot(3)).toEqual(playBot(3));
  });
});
