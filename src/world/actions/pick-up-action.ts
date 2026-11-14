import type { Game } from '../game';
import type { Hero } from '../hero';
import { Action, ActionResult } from './action';

export class PickUpAction extends Action {
  private readonly hero: Hero;

  constructor(hero: Hero) {
    super(hero);
    this.hero = hero;
  }

  override perform(game: Game): ActionResult {
    const item = game.stage.itemAt(this.hero.pos);
    if (!item) return ActionResult.failure('Тут нічого немає.');

    game.stage.removeItem(item);
    this.hero.inventory.push(item.type);
    game.events.emit('itemPickedUp', item.type);
    return ActionResult.success;
  }
}
