import type { Action } from '../actions/action';
import { SummonAction } from '../actions/summon-action';
import type { Breed } from '../breeds';
import type { Game } from '../game';
import type { Monster } from '../monster';
import type { Behavior } from './behavior';
import { ChaseBehavior } from './chase-behavior';

/** In the second phase the boss summons instead of moving once every this many turns. */
const SUMMON_EVERY = 3;

/**
 * Two phases. While above half HP the boss only hunts the hero, from anywhere on
 * the floor. Once hurt, every few turns it calls a minion of `minionBreed` instead.
 * The phase is read from HP and the timing from the turn counter, so the behavior
 * keeps no state of its own, like every other `Behavior`.
 */
export class BossBehavior implements Behavior {
  private readonly minionBreed: Breed;
  private readonly chase = new ChaseBehavior(Number.POSITIVE_INFINITY);

  constructor(minionBreed: Breed) {
    this.minionBreed = minionBreed;
  }

  nextAction(boss: Monster, game: Game): Action {
    const isDesperate = boss.hp <= boss.maxHp / 2;
    if (isDesperate && game.turns % SUMMON_EVERY === 0) return new SummonAction(boss, this.minionBreed);
    return this.chase.nextAction(boss, game);
  }
}
