import type { Actor } from '../actor';
import type { Game } from '../game';
import { Action, ActionResult } from './action';

export class AttackAction extends Action {
  private readonly defender: Actor;

  constructor(attacker: Actor, defender: Actor) {
    super(attacker);
    this.defender = defender;
  }

  override perform(game: Game): ActionResult {
    const { actor: attacker, defender } = this;
    // A ±1 spread keeps fights from being fully predictable; the floor of 1 means
    // a weak attacker still chips away and every fight eventually ends.
    const damage = Math.max(1, attacker.attack + game.rng.int(-1, 1) - defender.defense);
    defender.hp = Math.max(0, defender.hp - damage);

    game.events.emit('attack', { attacker, defender, damage });
    if (!defender.isAlive) game.kill(defender, attacker);
    return ActionResult.success;
  }
}
