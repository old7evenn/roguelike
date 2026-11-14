import type { Actor } from '../world/actor';
import { Monster } from '../world/monster';
import type { Glyph } from './display';
import { theme } from './theme';

export function actorGlyph(actor: Actor): Glyph {
  return actor instanceof Monster ? theme.monsters[actor.breed.id] : theme.hero;
}

/** Lowercase, ready to drop into a sentence. */
export function actorName(actor: Actor): string {
  return actor instanceof Monster ? actor.breed.name : 'ти';
}
