import type { Behavior } from './behaviors/behavior';
import { ChaseBehavior } from './behaviors/chase-behavior';
import { WanderBehavior } from './behaviors/wander-behavior';

export type BreedId = 'rat' | 'bat' | 'goblin' | 'skeleton' | 'troll';

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
  readonly behavior: Behavior;
  /** The shallowest depth where this breed can appear. */
  readonly minDepth: number;
}

export const Breeds: Readonly<Record<BreedId, Breed>> = {
  rat: {
    id: 'rat',
    name: 'щур',
    maxHp: 3,
    attack: 1,
    defense: 0,
    behavior: new ChaseBehavior(6),
    minDepth: 1,
  },
  bat: {
    id: 'bat',
    name: 'кажан',
    maxHp: 2,
    attack: 1,
    defense: 0,
    behavior: new WanderBehavior(),
    minDepth: 1,
  },
  goblin: {
    id: 'goblin',
    name: 'гоблін',
    maxHp: 6,
    attack: 3,
    defense: 1,
    behavior: new ChaseBehavior(8),
    minDepth: 3,
  },
  skeleton: {
    id: 'skeleton',
    name: 'скелет',
    maxHp: 10,
    attack: 4,
    defense: 2,
    behavior: new ChaseBehavior(10),
    minDepth: 5,
  },
  troll: {
    id: 'troll',
    name: 'троль',
    maxHp: 18,
    attack: 6,
    defense: 3,
    behavior: new ChaseBehavior(8),
    minDepth: 8,
  },
};

/**
 * Deeper floors unlock stronger breeds while keeping the weak ones, so the
 * average monster gets tougher with depth without being uniform.
 */
export function breedsForDepth(depth: number): Breed[] {
  return Object.values(Breeds).filter((breed) => breed.minDepth <= depth);
}
