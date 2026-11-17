import { describe, expect, it } from 'vitest';
import { Rng } from '../src/engine/rng';
import { Direction, Vec } from '../src/engine/vec';
import { buildLevel } from '../src/generation/level';
import { RoomsAndCorridors } from '../src/generation/rooms-and-corridors';
import { spawnItems } from '../src/generation/spawn-items';
import type { Action } from '../src/world/actions/action';
import { PickUpAction } from '../src/world/actions/pick-up-action';
import { UseItemAction } from '../src/world/actions/use-item-action';
import { WalkAction } from '../src/world/actions/walk-action';
import { Game } from '../src/world/game';
import { HERO_STATS } from '../src/world/hero';
import { type ItemType, ItemTypes, itemsForDepth } from '../src/world/items';
import { Tiles } from '../src/world/tile';
import { clearMonsters, OpenRoom } from './helpers';

/** An empty `OpenRoom`, optionally with one item lying east of the hero. */
function emptyRoom(itemEast?: ItemType): Game {
  const game = new Game(1, () => new OpenRoom());
  clearMonsters(game);
  for (const item of [...game.stage.items]) game.stage.removeItem(item);
  if (itemEast) game.stage.addItem({ type: itemEast, pos: new Vec(2, 1) });
  return game;
}

function heroDoes(game: Game, action: Action): void {
  game.hero.setNextAction(action);
  game.update();
}

describe('item types', () => {
  it('unlocks better items deeper', () => {
    expect(itemsForDepth(1).map((item) => item.id)).toEqual(['tea', 'pencil']);
    expect(itemsForDepth(4)).not.toContain(ItemTypes.sweater);
    expect(itemsForDepth(5)).toContain(ItemTypes.sweater);
    expect(itemsForDepth(8)).not.toContain(ItemTypes.blanket);
    expect(itemsForDepth(9)).toContain(ItemTypes.blanket);
    expect(itemsForDepth(10)).toHaveLength(Object.keys(ItemTypes).length);
  });
});

describe('spawnItems', () => {
  const generator = new RoomsAndCorridors();

  it('is deterministic for a given seed', () => {
    const level = buildLevel(generator, 99);
    const describe = (seed: number) =>
      spawnItems(level, 5, new Rng(seed)).map((i) => `${i.type.id}@${i.pos}`);
    expect(describe(7)).toEqual(describe(7));
  });

  it('places items on free floor, never on the start or the stairs, one per cell (200 seeds)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const level = buildLevel(generator, seed);
      const items = spawnItems(level, 10, new Rng(seed));

      expect(items.length).toBeGreaterThan(0);
      expect(new Set(items.map((item) => `${item.pos}`)).size).toBe(items.length);
      for (const { pos } of items) {
        expect(level.tiles.get(pos), `seed ${seed} at ${pos}`).toBe(Tiles.floor);
        expect(pos.equals(level.start)).toBe(false);
      }
    }
  });

  it('only spawns items allowed at the depth', () => {
    for (let seed = 0; seed < 100; seed++) {
      for (const { type } of spawnItems(buildLevel(generator, seed), 1, new Rng(seed))) {
        expect(type.minDepth).toBe(1);
      }
    }
  });
});

describe('picking up', () => {
  it('picks an item up by stepping onto it, in the same turn', () => {
    const game = emptyRoom(ItemTypes.tea);
    const picked: ItemType[] = [];
    game.events.on('itemPickedUp', (item) => picked.push(item));

    heroDoes(game, new WalkAction(game.hero, Direction.east));

    expect(game.hero.pos).toEqual(new Vec(2, 1));
    expect(game.hero.inventory).toEqual([ItemTypes.tea]);
    expect(game.stage.items).toHaveLength(0);
    expect(game.turns).toBe(1);
    expect(picked).toEqual([ItemTypes.tea]);
  });

  it('fails without spending a turn when there is nothing to pick up', () => {
    const game = emptyRoom();
    heroDoes(game, new PickUpAction(game.hero));
    expect(game.turns).toBe(0);
  });
});

describe('using items', () => {
  it('heals with a potion, up to max HP, and uses it up', () => {
    const game = emptyRoom();
    const { hero } = game;
    hero.inventory.push(ItemTypes.tea, ItemTypes.tea);
    hero.hp = HERO_STATS.maxHp - 2;

    heroDoes(game, new UseItemAction(hero, ItemTypes.tea));

    expect(hero.hp).toBe(HERO_STATS.maxHp);
    expect(hero.inventory).toEqual([ItemTypes.tea]);
    expect(game.turns).toBe(1);
  });

  it('keeps the potion and the turn when HP is already full', () => {
    const game = emptyRoom();
    game.hero.inventory.push(ItemTypes.tea);

    heroDoes(game, new UseItemAction(game.hero, ItemTypes.tea));

    expect(game.hero.inventory).toEqual([ItemTypes.tea]);
    expect(game.turns).toBe(0);
  });

  it('equips a weapon for an attack bonus and puts the old one back in the bag', () => {
    const game = emptyRoom();
    const { hero } = game;
    hero.inventory.push(ItemTypes.pencil, ItemTypes.diary);

    heroDoes(game, new UseItemAction(hero, ItemTypes.pencil));
    expect(hero.weapon).toBe(ItemTypes.pencil);
    expect(hero.attack).toBe(HERO_STATS.attack + ItemTypes.pencil.attackBonus);

    heroDoes(game, new UseItemAction(hero, ItemTypes.diary));
    expect(hero.weapon).toBe(ItemTypes.diary);
    expect(hero.attack).toBe(HERO_STATS.attack + ItemTypes.diary.attackBonus);
    expect(hero.inventory).toEqual([ItemTypes.pencil]);
  });

  it('equips armor for a defense bonus and puts the old one back in the bag', () => {
    const game = emptyRoom();
    const { hero } = game;
    hero.inventory.push(ItemTypes.sweater, ItemTypes.blanket);

    heroDoes(game, new UseItemAction(hero, ItemTypes.sweater));
    expect(hero.armor).toBe(ItemTypes.sweater);
    expect(hero.defense).toBe(HERO_STATS.defense + ItemTypes.sweater.defenseBonus);

    heroDoes(game, new UseItemAction(hero, ItemTypes.blanket));
    expect(hero.armor).toBe(ItemTypes.blanket);
    expect(hero.defense).toBe(HERO_STATS.defense + ItemTypes.blanket.defenseBonus);
    expect(hero.inventory).toEqual([ItemTypes.sweater]);
  });

  it('refuses an item the hero does not have', () => {
    const game = emptyRoom();
    heroDoes(game, new UseItemAction(game.hero, ItemTypes.diary));
    expect(game.hero.weapon).toBeNull();
    expect(game.turns).toBe(0);
  });
});

describe('items in a game', () => {
  it('lays out the same items for the same seed', () => {
    const layout = (seed: number) => {
      const game = new Game(seed);
      return game.stage.items.map((item) => `${item.type.id}@${item.pos}`);
    };
    expect(layout(1234)).toEqual(layout(1234));
    expect(layout(1234).length).toBeGreaterThan(0);
  });
});
