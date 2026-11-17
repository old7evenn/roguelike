import { distanceMap } from '../../engine/distance-map';
import { fieldOfView } from '../../engine/field-of-view';
import { CARDINAL_DIRECTIONS, type Vec } from '../../engine/vec';
import type { Action } from '../actions/action';
import { RestAction } from '../actions/rest-action';
import { WalkAction } from '../actions/walk-action';
import type { Game } from '../game';
import type { Monster } from '../monster';

/** True line of sight: distance alone is not enough when a wall is in the way. */
export function seesHero(monster: Monster, game: Game, radius: number): boolean {
  if (radius <= 0) return false;
  const dx = game.hero.pos.x - monster.pos.x;
  const dy = game.hero.pos.y - monster.pos.y;
  if (dx * dx + dy * dy > radius * radius) return false;

  const { stage } = game;
  const visible = fieldOfView(stage.width, stage.height, monster.pos, radius, (pos) => {
    return !stage.tileAt(pos).isTransparent;
  });
  return visible.get(game.hero.pos);
}

/** Hearing follows corridors, but the Manhattan check avoids a full map scan when obviously too far away. */
export function hearsHero(monster: Monster, game: Game, radius: number): boolean {
  const dx = Math.abs(game.hero.pos.x - monster.pos.x);
  const dy = Math.abs(game.hero.pos.y - monster.pos.y);
  if (dx + dy > radius) return false;

  const { stage, hero } = game;
  const toHero = distanceMap(stage.width, stage.height, hero.pos, (pos) => stage.isWalkable(pos));
  return toHero.get(monster.pos) <= radius;
}

/** Remembers a sighting briefly, follows it around blockers, then resumes patrolling. */
export function pursueOrPatrol(
  monster: Monster,
  game: Game,
  noticedHero: boolean,
  pursuitTurns: number,
): Action {
  let forgetAfterAction = false;
  if (noticedHero) {
    const wasCalm = monster.alertTurns === 0;
    monster.lastKnownHeroPos = game.hero.pos;
    monster.alertTurns = pursuitTurns;
    if (wasCalm) game.events.emit('monsterAlerted', monster);
  } else if (monster.alertTurns > 0) {
    monster.alertTurns--;
    forgetAfterAction = monster.alertTurns === 0;
  } else {
    monster.lastKnownHeroPos = null;
  }

  const target = monster.lastKnownHeroPos;
  if (target) {
    if (monster.pos.equals(target)) {
      calm(monster);
    } else {
      const step = stepToward(monster, game, target);
      if (step) {
        const action = new WalkAction(monster, step);
        if (forgetAfterAction) monster.lastKnownHeroPos = null;
        return action;
      }
      calm(monster);
    }
  }
  return patrol(monster, game);
}

function calm(monster: Monster): void {
  monster.lastKnownHeroPos = null;
  monster.alertTurns = 0;
}

function stepToward(monster: Monster, game: Game, target: Vec): Vec | undefined {
  const { stage, hero } = game;
  const passable = (pos: Vec): boolean => {
    if (!stage.isWalkable(pos)) return false;
    const occupant = stage.actorAt(pos);
    return !occupant || occupant === monster || occupant === hero;
  };
  const toTarget = distanceMap(stage.width, stage.height, target, passable);
  const here = toTarget.get(monster.pos);
  return CARDINAL_DIRECTIONS.find((direction) => {
    const next = monster.pos.add(direction);
    return toTarget.contains(next) && toTarget.get(next) < here && passable(next);
  });
}

function patrol(monster: Monster, game: Game): Action {
  const directions = CARDINAL_DIRECTIONS.filter((direction) => {
    const next = monster.pos.add(direction);
    return game.stage.isWalkable(next) && !game.stage.actorAt(next);
  });
  return directions.length > 0 ? new WalkAction(monster, game.rng.pick(directions)) : new RestAction(monster);
}
