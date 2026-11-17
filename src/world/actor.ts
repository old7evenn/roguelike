import type { Vec } from '../engine/vec';
import type { Action } from './actions/action';
import type { Game } from './game';

/** Anything that takes turns and can fight: the hero and the monsters. */
export abstract class Actor {
  pos: Vec;
  hp: number;
  /** Scheduler state: acting spends 100 energy, and speed refills it. */
  energy = 0;

  abstract readonly maxHp: number;
  abstract readonly attack: number;
  abstract readonly defense: number;
  abstract readonly speed: number;

  constructor(pos: Vec, hp: number) {
    this.pos = pos;
    this.hp = hp;
  }

  get isAlive(): boolean {
    return this.hp > 0;
  }

  /** The action for this turn, or null while waiting for player input. */
  abstract nextAction(game: Game): Action | null;
}
