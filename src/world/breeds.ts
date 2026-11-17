import { config } from '../config';
import type { Behavior } from './behaviors/behavior';
import { BossBehavior } from './behaviors/boss-behavior';
import { ChaseBehavior } from './behaviors/chase-behavior';
import { WanderBehavior } from './behaviors/wander-behavior';

/** Breeds that spawn at random; the boss is placed by hand on the last floor. */
type SpawnableBreedId = 'whisper' | 'restlessness' | 'reproach' | 'memory' | 'burden';
export type BreedId = SpawnableBreedId | 'despair';

/**
 * Type Object pattern: everything monsters of one kind share. A new monster kind
 * is a new row in `Breeds`, not a new subclass of `Monster`.
 */
export interface Breed {
  readonly id: BreedId;
  /** Shown to the player, so it is Ukrainian. */
  readonly name: string;
  readonly maxHp: number;
  readonly attack: number;
  readonly defense: number;
  readonly speed: number;
  readonly behavior: Behavior;
  /** The shallowest depth where this breed can appear. */
  readonly minDepth: number;
}

export const Breeds: Readonly<Record<SpawnableBreedId, Breed>> = {
  whisper: {
    id: 'whisper',
    name: 'шепіт',
    maxHp: 3,
    attack: 1,
    defense: 0,
    speed: 100,
    behavior: new ChaseBehavior(6),
    minDepth: 1,
  },
  restlessness: {
    id: 'restlessness',
    name: 'неспокій',
    maxHp: 2,
    attack: 1,
    defense: 0,
    speed: 125,
    behavior: new WanderBehavior(),
    minDepth: 1,
  },
  reproach: {
    id: 'reproach',
    name: 'докір',
    maxHp: 6,
    attack: 3,
    defense: 1,
    speed: 100,
    behavior: new ChaseBehavior(8),
    minDepth: 3,
  },
  memory: {
    id: 'memory',
    name: 'спогад',
    maxHp: 10,
    attack: 4,
    defense: 2,
    speed: 100,
    behavior: new ChaseBehavior(10),
    minDepth: 5,
  },
  burden: {
    id: 'burden',
    name: 'тягар',
    maxHp: 14,
    attack: 5,
    defense: 2,
    speed: 75,
    behavior: new ChaseBehavior(8),
    minDepth: 8,
  },
};

/** The final boss, waiting at the far end of the last floor. Killing it wins the game. */
export const Boss: Breed = {
  id: 'despair',
  name: 'відчай',
  maxHp: 32,
  attack: 5,
  defense: 1,
  speed: 100,
  behavior: new BossBehavior(Breeds.whisper),
  minDepth: config.maxDepth,
};

/**
 * Deeper floors unlock stronger breeds while keeping the weak ones, so the
 * average monster gets tougher with depth without being uniform.
 */
export function breedsForDepth(depth: number): Breed[] {
  return Object.values(Breeds).filter((breed) => breed.minDepth <= depth);
}
