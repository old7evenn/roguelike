import type { Game } from '../game';
import type { Hero } from '../hero';
import type { InventoryItemType } from '../items';
import { Action, ActionResult } from './action';

export class UseItemAction extends Action {
  private readonly hero: Hero;
  private readonly item: InventoryItemType;

  constructor(hero: Hero, item: InventoryItemType) {
    super(hero);
    this.hero = hero;
    this.item = item;
  }

  override perform(game: Game): ActionResult {
    const { hero, item } = this;
    const index = hero.inventory.indexOf(item);
    if (index === -1) return ActionResult.failure('Цього в тебе немає.');

    switch (item.kind) {
      case 'potion':
        // Failing here costs no turn, so a misclick doesn't waste the potion.
        if (hero.hp >= hero.maxHp) return ActionResult.failure('Сили й так повні.');
        hero.inventory.splice(index, 1);
        hero.hp = Math.min(hero.maxHp, hero.hp + item.heal);
        break;
      case 'weapon':
        hero.inventory.splice(index, 1);
        if (hero.weapon) hero.inventory.push(hero.weapon);
        hero.weapon = item;
        break;
      case 'armor':
        hero.inventory.splice(index, 1);
        if (hero.armor) hero.inventory.push(hero.armor);
        hero.armor = item;
        break;
    }

    game.events.emit('itemUsed', item);
    return ActionResult.success;
  }
}
