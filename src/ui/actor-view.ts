import type { Actor } from '../world/actor';
import { Monster } from '../world/monster';
import type { Sprite } from './display';
import { theme } from './theme';

export function actorSprite(actor: Actor): Sprite {
  return actor instanceof Monster ? theme.monsters[actor.breed.id] : theme.hero;
}

/** Lowercase, ready to drop into a sentence. */
export function actorName(actor: Actor): string {
  return actor instanceof Monster ? actor.breed.name : 'ти';
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
