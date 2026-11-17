import type { Action } from '../actions/action';
import type { Game } from '../game';
import type { Monster } from '../monster';
import { pursueOrPatrol, seesHero } from './aware-movement';
import type { Behavior } from './behavior';

/** Restlessly patrols and gives chase only after seeing the hero. */
export class WanderBehavior implements Behavior {
  private readonly visionRadius: number;
  private readonly pursuitTurns: number;

  constructor(visionRadius = 4, pursuitTurns = 1) {
    this.visionRadius = visionRadius;
    this.pursuitTurns = pursuitTurns;
  }

  nextAction(monster: Monster, game: Game): Action {
    return pursueOrPatrol(monster, game, seesHero(monster, game, this.visionRadius), this.pursuitTurns);
  }
}
