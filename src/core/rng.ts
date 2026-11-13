/**
 * Детермінований генератор випадкових чисел (PRNG).
 *
 * Math.random() не можна «засіяти»: кожен запуск дає інші числа.
 * Нам потрібно, щоб seed 1234 ЗАВЖДИ давав те саме підземелля,
 * тому беремо mulberry32 — маленький швидкий PRNG із 32-бітним станом.
 */

export interface Rng {
  /** Число в діапазоні [0, 1). */
  next(): number;
  /** Ціле число в діапазоні [min, max] включно. */
  int(min: number, max: number): number;
  /** true з імовірністю p. */
  chance(p: number): boolean;
  /** Випадковий елемент масиву. */
  pick<T>(items: readonly T[]): T;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0; // >>> 0 перетворює число на беззнакове 32-бітне ціле
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // ділимо на 2^32
  };
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  return {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    chance(p) {
      return next() < p;
    },
    pick(items) {
      if (items.length === 0) throw new Error('pick() from empty array');
      return items[Math.floor(next() * items.length)]!;
    },
  };
}

/**
 * Змішує seed забігу з номером поверху і дає незалежний seed для поверху.
 * Завдяки цьому поверх 3 сиду 1234 однаковий незалежно від того,
 * скільки випадкових чисел гра витратила на поверхах 1–2.
 */
export function deriveSeed(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** "1234" → 1234; будь-який інший текст → хеш FNV-1a (щоб можна було мати seed "kyiv"). */
export function seedFromString(text: string): number {
  const trimmed = text.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) >>> 0;
  let h = 0x811c9dc5;
  for (let i = 0; i < trimmed.length; i++) {
    h ^= trimmed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Короткий seed, який легко продиктувати другу. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}
