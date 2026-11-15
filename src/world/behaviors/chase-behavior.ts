import { distanceMap } from '../../engine/distance-map';
import { CARDINAL_DIRECTIONS } from '../../engine/vec';
import type { Action } from '../actions/action';
import { RestAction } from '../actions/rest-action';
import { WalkAction } from '../actions/walk-action';
import type { Game } from '../game';
import type { Monster } from '../monster';
import type { Behavior } from './behavior';

/**
 * Walks downhill on a distance map from the hero, i.e. along a shortest path.
 * Field of view is the hero's alone: a monster "senses" the hero when they are
 * at most `senseRadius` steps away by path, hearing them through the corridors.
 * So a thought can creep up from the dark before the hero sees it.
 */
export class ChaseBehavior implements Behavior {
  private readonly senseRadius: number;

  constructor(senseRadius: number) {
    this.senseRadius = senseRadius;
  }

  nextAction(monster: Monster, game: Game): Action {
    const { stage, hero } = game;
    // Other monsters are ignored here so a crowd doesn't hide the hero; they are
    // only checked when picking the actual step.
    const toHero = distanceMap(stage.width, stage.height, hero.pos, (pos) => stage.isWalkable(pos));
    const here = toHero.get(monster.pos);
    if (here > this.senseRadius) return new RestAction(monster);

    const step = CARDINAL_DIRECTIONS.find((direction) => {
      const next = monster.pos.add(direction);
      if (!toHero.contains(next) || toHero.get(next) >= here) return false;
      // Stepping into the hero is allowed: `WalkAction` turns that bump into an attack.
      const occupant = stage.actorAt(next);
      return !occupant || occupant === hero;
    });
    return step ? new WalkAction(monster, step) : new RestAction(monster);
  }
}
