import { CARDINAL_DIRECTIONS } from '../../engine/vec';
import type { Action } from '../actions/action';
import { RestAction } from '../actions/rest-action';
import { WalkAction } from '../actions/walk-action';
import type { Game } from '../game';
import type { Monster } from '../monster';
import type { Behavior } from './behavior';

/** Steps to a random free neighbouring cell, ignoring the hero entirely. */
export class WanderBehavior implements Behavior {
  nextAction(monster: Monster, game: Game): Action {
    const { stage } = game;
    const directions = CARDINAL_DIRECTIONS.filter((direction) => {
      const next = monster.pos.add(direction);
      return stage.isWalkable(next) && !stage.actorAt(next);
    });
    if (directions.length === 0) return new RestAction(monster);
    return new WalkAction(monster, game.rng.pick(directions));
  }
}
