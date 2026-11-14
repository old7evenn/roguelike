import type { Actor } from '../actor';
import type { Game } from '../game';

/**
 * `alternate` lets an action hand off to a different one: walking into stairs
 * becomes descending, walking into an enemy becomes attacking, and walking onto
 * an item ends with picking it up — without the input layer knowing about any of it.
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
