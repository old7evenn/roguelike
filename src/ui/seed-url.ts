import { seedFromString } from '../engine/rng';

const PARAM = 'seed';

export function readSeedFromUrl(): number | null {
  const value = new URLSearchParams(location.search).get(PARAM);
  return value ? seedFromString(value) : null;
}

/** replaceState, not pushState: changing the seed shouldn't fill the back button history. */
export function writeSeedToUrl(seed: number): void {
  const url = new URL(location.href);
  url.searchParams.set(PARAM, String(seed));
  history.replaceState(null, '', url);
}
