import type { Vec } from '../engine/vec';
import type { Action } from './actions/action';
import type { Game } from './game';

/** Anything that takes turns: the hero now, monsters later. */
export abstract class Actor {
  pos: Vec;

  constructor(pos: Vec) {
    this.pos = pos;
  }

  /** The action for this turn, or null while waiting for player input. */
  abstract nextAction(game: Game): Action | null;
}
