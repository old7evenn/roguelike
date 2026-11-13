import type { Action } from '../actions/action';
import type { Game } from '../game';
import type { Monster } from '../monster';

/**
 * Strategy pattern: a monster delegates choosing its turn to a behavior, so a new
 * way of acting is a new class rather than a branch inside `Monster`.
 * Behaviors are stateless and shared by every monster of a breed.
 */
export interface Behavior {
  nextAction(monster: Monster, game: Game): Action;
}
