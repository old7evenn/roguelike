import { describe, expect, it } from 'vitest';
import { distanceMap } from '../src/engine/distance-map';
import { Rng } from '../src/engine/rng';
import { Vec } from '../src/engine/vec';
import { buildLevel } from '../src/generation/level';
import { RoomsAndCorridors } from '../src/generation/rooms-and-corridors';
import { SAFE_RADIUS, spawnMonsters } from '../src/generation/spawn-monsters';
import { RestAction } from '../src/world/actions/rest-action';
import type { Behavior } from '../src/world/behaviors/behavior';
import { ChaseBehavior } from '../src/world/behaviors/chase-behavior';
import { WanderBehavior } from '../src/world/behaviors/wander-behavior';
import { Breeds, breedsForDepth } from '../src/world/breeds';
import { Game } from '../src/world/game';
import { Monster } from '../src/world/monster';
import { Tiles } from '../src/world/tile';
import { gameWith, rest } from './helpers';

function monstersOf(game: Game): Monster[] {
  return game.stage.actors.filter((actor) => actor instanceof Monster);
}

describe('breeds', () => {
  it('unlocks stronger breeds deeper', () => {
    expect(breedsForDepth(1).map((breed) => breed.id)).toEqual(['whisper', 'restlessness']);
    expect(breedsForDepth(10)).toHaveLength(Object.keys(Breeds).length);
  });

  it('gives every monster its own hp, starting at the breed maximum', () => {
    const a = new Monster(Breeds.reproach, new Vec(1, 1));
    const b = new Monster(Breeds.reproach, new Vec(2, 1));
    a.hp -= 2;
    expect(b.hp).toBe(Breeds.reproach.maxHp);
  });
});

describe('spawnMonsters', () => {
  const generator = new RoomsAndCorridors();

  it('is deterministic for a given seed', () => {
    const level = buildLevel(generator, 99);
    const describe = (monsters: Monster[]) => monsters.map((m) => `${m.breed.id}@${m.pos}`);
    expect(describe(spawnMonsters(level, 5, new Rng(7)))).toEqual(
      describe(spawnMonsters(level, 5, new Rng(7))),
    );
  });

  it('places monsters on free floor away from the start, one per cell (200 seeds)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const level = buildLevel(generator, seed);
      const { tiles, start } = level;
      const fromStart = distanceMap(tiles.width, tiles.height, start, (pos) => tiles.get(pos).isWalkable);
      const monsters = spawnMonsters(level, 10, new Rng(seed));

      expect(monsters.length).toBeGreaterThan(0);
      expect(new Set(monsters.map((m) => `${m.pos}`)).size).toBe(monsters.length);
      for (const { pos } of monsters) {
        expect(tiles.get(pos), `seed ${seed} at ${pos}`).toBe(Tiles.floor);
        expect(fromStart.get(pos)).toBeGreaterThan(SAFE_RADIUS);
      }
    }
  });

  it('spawns more and tougher monsters deeper', () => {
    let shallowHp = 0;
    let deepHp = 0;
    for (let seed = 0; seed < 100; seed++) {
      const level = buildLevel(generator, seed);
      for (const m of spawnMonsters(level, 1, new Rng(seed))) {
        expect(m.breed.minDepth).toBe(1);
        shallowHp += m.hp;
      }
      for (const m of spawnMonsters(level, 10, new Rng(seed))) deepHp += m.hp;
    }
    expect(deepHp).toBeGreaterThan(shallowHp * 3);
  });
});

describe('Game with monsters', () => {
  it('moves monsters identically for the same seed', () => {
    const positions = (seed: number) => {
      const game = new Game(seed);
      rest(game, 30);
      return monstersOf(game).map((m) => `${m.breed.id}@${m.pos}`);
    };
    expect(positions(1234)).toEqual(positions(1234));
  });

  it('lets fast monsters act more often and slow monsters less often', () => {
    const actionsInFourHeroTurns = (speed: number): number => {
      let actions = 0;
      const behavior: Behavior = {
        nextAction(monster) {
          actions++;
          return new RestAction(monster);
        },
      };
      const { game } = gameWith({ ...Breeds.whisper, speed, behavior }, new Vec(5, 3));
      rest(game, 4);
      return actions;
    };

    expect(actionsInFourHeroTurns(125)).toBe(5);
    expect(actionsInFourHeroTurns(100)).toBe(4);
    expect(actionsInFourHeroTurns(75)).toBe(3);
  });
});

describe('ChaseBehavior', () => {
  const chase = new ChaseBehavior(6);

  it('steps closer to a hero it can sense, then waits next to them', () => {
    const { game, monster } = gameWith({ ...Breeds.whisper, behavior: chase }, new Vec(5, 3));
    const distanceToHero = () => {
      const { x, y } = game.hero.pos;
      return Math.abs(monster.pos.x - x) + Math.abs(monster.pos.y - y);
    };

    rest(game, 1);
    expect(distanceToHero()).toBe(5);
    rest(game, 10);
    expect(distanceToHero()).toBe(1);
  });

  it('stays put when the hero is beyond its sense radius', () => {
    const { game, monster } = gameWith(Breeds.whisper, new Vec(15, 5));
    expect(chase.nextAction(monster, game)).toBeInstanceOf(RestAction);
  });

  it('takes another shortest step when a monster blocks the first one', () => {
    const { game, monster } = gameWith(Breeds.whisper, new Vec(3, 2));
    game.stage.addActor(new Monster(Breeds.restlessness, new Vec(3, 1)));

    chase.nextAction(monster, game).perform(game);
    expect(monster.pos).toEqual(new Vec(2, 2));
  });

  it('waits behind a monster when no other step gets closer', () => {
    const { game, monster } = gameWith(Breeds.whisper, new Vec(3, 1));
    game.stage.addActor(new Monster(Breeds.restlessness, new Vec(2, 1)));
    expect(chase.nextAction(monster, game)).toBeInstanceOf(RestAction);
  });
});

describe('WanderBehavior', () => {
  it('only steps onto free walkable neighbours', () => {
    const wander = new WanderBehavior();
    const { game, monster } = gameWith(Breeds.restlessness, new Vec(1, 2));
    game.stage.addActor(new Monster(Breeds.restlessness, new Vec(2, 2)));

    for (let i = 0; i < 20; i++) {
      monster.pos = new Vec(1, 2);
      wander.nextAction(monster, game).perform(game);
      // (1, 1) is the hero, (0, 2) is a wall, (2, 2) is the other monster.
      expect(monster.pos).toEqual(new Vec(1, 3));
    }
  });
});
