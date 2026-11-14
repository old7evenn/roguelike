import type { Actor } from '../actor';
import type { Game } from '../game';

/**
 * `alternate` lets an action hand off to a different one instead of failing:
 * walking into stairs becomes descending and walking into an enemy becomes
 * attacking — without the input layer knowing about either.
 */
export type ActionResult =
  | { readonly type: 'success' }
  | { readonly type: 'failure'; readonly reason: string }
  | { readonly type: 'alternate'; readonly action: Action };

export const ActionResult = {
  success: { type: 'success' } as ActionResult,
  failure: (reason: string): ActionResult => ({ type: 'failure', reason }),
  alternate: (action: Action): ActionResult => ({ type: 'alternate', action }),
};

/** Command pattern: a turn's intent as an object the game loop can run uniformly. */
export abstract class Action {
  protected readonly actor: Actor;

  constructor(actor: Actor) {
    this.actor = actor;
  }

  abstract perform(game: Game): ActionResult;
}
