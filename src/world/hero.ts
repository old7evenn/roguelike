import type { Vec } from '../engine/vec';
import type { Action } from './actions/action';
import { Actor } from './actor';

export const HERO_STATS = { maxHp: 20, attack: 3, defense: 1 } as const;

/** Controlled by the UI: input queues an action, the game loop consumes it. */
export class Hero extends Actor {
  readonly maxHp = HERO_STATS.maxHp;
  readonly attack = HERO_STATS.attack;
  readonly defense = HERO_STATS.defense;

  private queuedAction: Action | null = null;

  constructor(pos: Vec) {
    super(pos, HERO_STATS.maxHp);
  }

  setNextAction(action: Action): void {
    this.queuedAction = action;
  }

  override nextAction(): Action | null {
    const action = this.queuedAction;
    this.queuedAction = null;
    return action;
  }
}
