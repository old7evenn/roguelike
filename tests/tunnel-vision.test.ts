import { describe, expect, it } from 'vitest';
import { Vec } from '../src/engine/vec';
import { UseItemAction } from '../src/world/actions/use-item-action';
import { Game } from '../src/world/game';
import { HERO_STATS, Hero, SIGHT } from '../src/world/hero';
import { ItemTypes } from '../src/world/items';
import { clearMonsters, OpenRoom, rest } from './helpers';

function visibleCount(game: Game): number {
  let count = 0;
  for (const [pos] of game.stage.tiles.entries()) if (game.stage.isVisible(pos)) count++;
  return count;
}

describe('tunnel vision', () => {
  it('sees widest at full HP and narrowest at the last HP point', () => {
    const hero = new Hero(new Vec(0, 0));
    expect(hero.sightRadius).toBe(SIGHT.widest);
    hero.hp = 1;
    expect(hero.sightRadius).toBe(SIGHT.narrowest);
  });

  it('never widens as HP drops', () => {
    const hero = new Hero(new Vec(0, 0));
    let previous = hero.sightRadius;
    for (let hp = HERO_STATS.maxHp; hp >= 1; hp--) {
      hero.hp = hp;
      expect(hero.sightRadius).toBeLessThanOrEqual(previous);
      previous = hero.sightRadius;
    }
  });

  it('shrinks the view when hurt and widens it again after healing', () => {
    const game = new Game(1, new OpenRoom());
    clearMonsters(game);
    const { hero } = game;
    hero.pos = new Vec(10, 3);
    rest(game, 1);
    const healthy = visibleCount(game);

    hero.hp = 2;
    rest(game, 1);
    const hurt = visibleCount(game);
    expect(hurt).toBeLessThan(healthy);

    hero.inventory.push(ItemTypes.cocoa, ItemTypes.cocoa);
    hero.setNextAction(new UseItemAction(hero, ItemTypes.cocoa));
    game.update();
    hero.setNextAction(new UseItemAction(hero, ItemTypes.cocoa));
    game.update();
    expect(visibleCount(game)).toBe(healthy);
  });
});
