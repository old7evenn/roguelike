import { describe, expect, it } from 'vitest';
import { Direction, Vec } from '../src/engine/vec';
import { RestAction } from '../src/world/actions/rest-action';
import { WalkAction } from '../src/world/actions/walk-action';
import type { Actor } from '../src/world/actor';
import type { Behavior } from '../src/world/behaviors/behavior';
import { type Breed, Breeds } from '../src/world/breeds';
import type { Game, GameEvents } from '../src/world/game';
import { HERO_STATS } from '../src/world/hero';
import { Monster } from '../src/world/monster';
import { gameWith, rest } from './helpers';

/** Never moves, so a fight happens exactly where the test puts it. */
const standStill: Behavior = { nextAction: (monster) => new RestAction(monster) };

function dummy(stats: Partial<Breed> = {}): Breed {
  return { ...Breeds.whisper, behavior: standStill, ...stats };
}

function walkEast(game: Game): void {
  game.hero.setNextAction(new WalkAction(game.hero, Direction.east));
  game.update();
}

function record<K extends keyof GameEvents>(game: Game, type: K): GameEvents[K][] {
  const events: GameEvents[K][] = [];
  game.events.on(type, (payload) => events.push(payload));
  return events;
}

describe('bump to attack', () => {
  it('hits a monster instead of walking into it, and spends the turn', () => {
    const { game, monster } = gameWith(dummy({ maxHp: 50 }), new Vec(2, 1));
    const attacks = record(game, 'attack');

    walkEast(game);

    expect(game.hero.pos).toEqual(new Vec(1, 1));
    expect(game.turns).toBe(1);
    expect(attacks).toHaveLength(1);
    expect(attacks[0]?.attacker).toBe(game.hero);
    expect(attacks[0]?.defender).toBe(monster);
    expect(monster.hp).toBe(50 - (attacks[0]?.damage ?? 0));
  });

  it('deals attack − defense, give or take 1, but never less than 1', () => {
    const soft = gameWith(dummy({ maxHp: 1000, defense: 0 }), new Vec(2, 1));
    const armored = gameWith(dummy({ maxHp: 1000, defense: 10 }), new Vec(2, 1));
    const softHits = record(soft.game, 'attack');
    const armoredHits = record(armored.game, 'attack');

    for (let i = 0; i < 50; i++) {
      walkEast(soft.game);
      walkEast(armored.game);
    }

    const softDamage = new Set(softHits.map((hit) => hit.damage));
    expect([...softDamage].sort()).toEqual([HERO_STATS.attack - 1, HERO_STATS.attack, HERO_STATS.attack + 1]);
    expect(new Set(armoredHits.map((hit) => hit.damage))).toEqual(new Set([1]));
  });

  it('lets a monster next to the hero hit them on its turn', () => {
    const { game, monster } = gameWith(Breeds.whisper, new Vec(2, 1));
    const attacks = record(game, 'attack');

    rest(game, 3);

    expect(attacks).toHaveLength(3);
    expect(attacks.every((hit) => hit.attacker === monster && hit.defender === game.hero)).toBe(true);
    expect(game.hero.hp).toBe(HERO_STATS.maxHp - 3);
  });

  it('never makes monsters fight each other', () => {
    const { game, monster } = gameWith(dummy(), new Vec(5, 1));
    const other = new Monster(dummy(), new Vec(6, 1));
    game.stage.addActor(other);

    const result = new WalkAction(monster, Direction.east).perform(game);

    expect(result.type).toBe('failure');
    expect(other.hp).toBe(other.maxHp);
  });
});

describe('death', () => {
  it('removes a killed monster from the stage and frees its cell', () => {
    const { game, monster } = gameWith(dummy({ maxHp: 1 }), new Vec(2, 1));
    const deaths = record(game, 'death');

    walkEast(game);
    expect(monster.isAlive).toBe(false);
    expect(game.stage.actors).not.toContain(monster);
    expect(deaths).toEqual([{ actor: monster, killer: game.hero }]);

    walkEast(game);
    expect(game.hero.pos).toEqual(new Vec(2, 1));
  });

  it('ends the game when the hero dies, and nothing acts afterwards', () => {
    const { game, monster } = gameWith({ ...Breeds.whisper, attack: 100 }, new Vec(2, 1));
    const defeats = record(game, 'defeat');
    const attacks = record(game, 'attack');

    rest(game, 1);
    expect(game.hero.hp).toBe(0);
    expect(game.status).toBe('lost');
    expect(defeats).toEqual([{ killer: monster }]);

    rest(game, 5);
    expect(attacks).toHaveLength(1);
  });

  it('keeps the turn order when an actor earlier in line dies', () => {
    let turnsTaken = 0;
    let victim: Actor | undefined;
    const killer: Behavior = {
      nextAction(monster, game) {
        turnsTaken++;
        if (victim) game.kill(victim, monster);
        victim = undefined;
        return new RestAction(monster);
      },
    };
    const { game, monster } = gameWith(dummy(), new Vec(10, 3));
    game.stage.addActor(new Monster(dummy({ behavior: killer }), new Vec(12, 3)));
    victim = monster;

    rest(game, 1);

    expect(game.stage.actors).toHaveLength(2);
    expect(turnsTaken).toBe(1);
  });
});

describe('combat determinism', () => {
  /** The hero fights a tough monster to the end; returns every blow dealt. */
  function fight(seed: number): string[] {
    const { game } = gameWith(Breeds.memory, new Vec(2, 1), seed);
    const blows: string[] = [];
    game.events.on('attack', ({ attacker, damage }) => {
      blows.push(`${attacker === game.hero ? 'hero' : 'monster'}:${damage}`);
    });
    while (game.status === 'playing' && game.stage.actors.length > 1) walkEast(game);
    return blows;
  }

  it('plays out the same fight for the same seed', () => {
    expect(fight(42)).toEqual(fight(42));
    expect(fight(42).length).toBeGreaterThan(2);
  });

  it('plays out a different fight for a different seed', () => {
    const fights = new Set([1, 2, 3, 4, 5].map((seed) => fight(seed).join()));
    expect(fights.size).toBeGreaterThan(1);
  });
});
