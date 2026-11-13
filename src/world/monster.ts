import type { Vec } from '../engine/vec';
import type { Action } from './actions/action';
import { Actor } from './actor';
import type { Breed } from './breeds';
import type { Game } from './game';

/** Per-monster state only; everything shared by its kind lives in the breed. */
export class Monster extends Actor {
  readonly breed: Breed;
  hp: number;

  constructor(breed: Breed, pos: Vec) {
    super(pos);
    this.breed = breed;
    this.hp = breed.maxHp;
  }

  override nextAction(game: Game): Action {
    return this.breed.behavior.nextAction(this, game);
  }
}
