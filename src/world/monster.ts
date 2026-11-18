import type { Vec } from '../engine/vec';
import type { Action } from './actions/action';
import { Actor } from './actor';
import type { Breed } from './breeds';
import type { Game } from './game';

/** Per-monster state only; everything shared by its kind lives in the breed. */
export class Monster extends Actor {
  readonly breed: Breed;
  /** Updated when the hero is seen or heard; cleared after the monster searches that cell. */
  lastKnownHeroPos: Vec | null = null;
  /** How many more actions to search after losing sight or sound of the hero. */
  alertTurns = 0;

  constructor(breed: Breed, pos: Vec) {
    super(pos, breed.maxHp);
    this.breed = breed;
  }

  get maxHp(): number {
    return this.breed.maxHp;
  }

  get attack(): number {
    return this.breed.attack;
  }

  get defense(): number {
    return this.breed.defense;
  }

  get speed(): number {
    return this.breed.speed;
  }

  override nextAction(game: Game): Action {
    return this.breed.behavior.nextAction(this, game);
  }
}
