import type { Vec } from '../engine/vec';
import type { Action } from './actions/action';
import { Actor } from './actor';
import type { ArmorType, ItemType, WeaponType } from './items';

export const HERO_STATS = { maxHp: 20, attack: 3, defense: 1, speed: 100, maxHpPerFloor: 5 } as const;

/** Sight radius at full HP and at the last HP point; see `Hero.sightRadius`. */
export const SIGHT = { widest: 8, narrowest: 3 } as const;

/** Controlled by the UI: input queues an action, the game loop consumes it. */
export class Hero extends Actor {
  /** Grows with every floor down; see `growStronger`. */
  maxHp: number = HERO_STATS.maxHp;
  readonly speed = HERO_STATS.speed;
  /** No size limit: there are only a handful of item kinds, and the screen groups duplicates. */
  readonly inventory: ItemType[] = [];
  weapon: WeaponType | null = null;
  armor: ArmorType | null = null;

  private queuedAction: Action | null = null;

  constructor(pos: Vec) {
    super(pos, HERO_STATS.maxHp);
  }

  get attack(): number {
    return HERO_STATS.attack + (this.weapon?.attackBonus ?? 0);
  }

  get defense(): number {
    return HERO_STATS.defense + (this.armor?.defenseBonus ?? 0);
  }

  /** Every floor survived toughens the hero: more max HP, and the new HP comes already filled. */
  growStronger(): void {
    this.maxHp += HERO_STATS.maxHpPerFloor;
    this.hp += HERO_STATS.maxHpPerFloor;
  }

  /**
   * Tunnel vision: the more hurt the hero is, the less of the world they take in.
   * Fear narrows the view, healing widens it back. Scales linearly with HP.
   */
  get sightRadius(): number {
    const health = this.hp / this.maxHp;
    return SIGHT.narrowest + Math.round((SIGHT.widest - SIGHT.narrowest) * health);
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
