import type { Action } from '../actions/action';
import type { Game } from '../game';
import type { Monster } from '../monster';
import { hearsHero, pursueOrPatrol, seesHero } from './aware-movement';
import type { Behavior } from './behavior';

/**
 * Patrols until it sees the hero or hears them nearby, then follows their last
 * known position by a shortest route. Other monsters count as path blockers.
 */
export class ChaseBehavior implements Behavior {
  private readonly hearingRadius: number;
  private readonly visionRadius: number;
  private readonly pursuitTurns: number;

  constructor(hearingRadius: number, visionRadius = hearingRadius, pursuitTurns = 3) {
    this.hearingRadius = hearingRadius;
    this.visionRadius = visionRadius;
    this.pursuitTurns = pursuitTurns;
  }

  nextAction(monster: Monster, game: Game): Action {
    const noticed =
      seesHero(monster, game, this.visionRadius) || hearsHero(monster, game, this.hearingRadius);
    return pursueOrPatrol(monster, game, noticed, this.pursuitTurns);
  }
}
