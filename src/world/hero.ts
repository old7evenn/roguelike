import type { Vec } from '../engine/vec';
import type { Action } from './actions/action';
import { Actor } from './actor';
import type { ItemType, WeaponType } from './items';

export const HERO_STATS = { maxHp: 20, attack: 3, defense: 1 } as const;

/** Controlled by the UI: input queues an action, the game loop consumes it. */
export class Hero extends Actor {
  readonly maxHp = HERO_STATS.maxHp;
  readonly defense = HERO_STATS.defense;
  /** No size limit: there are only a handful of item kinds, and the screen groups duplicates. */
  readonly inventory: ItemType[] = [];
  weapon: WeaponType | null = null;

  private queuedAction: Action | null = null;

  constructor(pos: Vec) {
    super(pos, HERO_STATS.maxHp);
  }

  get attack(): number {
    return HERO_STATS.attack + (this.weapon?.attackBonus ?? 0);
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
