import { CARDINAL_DIRECTIONS } from '../../engine/vec';
import type { Breed } from '../breeds';
import type { Game } from '../game';
import { Monster } from '../monster';
import { Action, ActionResult } from './action';

/** Calls a new monster of `breed` into a free cell next to the summoner. */
export class SummonAction extends Action {
  private readonly breed: Breed;

  constructor(summoner: Monster, breed: Breed) {
    super(summoner);
    this.breed = breed;
  }

  override perform(game: Game): ActionResult {
    const { stage } = game;
    const freeCells = CARDINAL_DIRECTIONS.map((direction) => this.actor.pos.add(direction)).filter(
      (pos) => stage.isWalkable(pos) && !stage.actorAt(pos),
    );
    if (freeCells.length === 0) return ActionResult.failure('Нікого не покликати: довкола тісно.');

    const summoned = new Monster(this.breed, game.rng.pick(freeCells));
    stage.addActor(summoned);
    game.events.emit('summon', { summoner: this.actor, summoned });
    return ActionResult.success;
  }
}
