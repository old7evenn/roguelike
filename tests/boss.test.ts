import { describe, expect, it } from 'vitest';
import { Vec } from '../src/engine/vec';
import { RestAction } from '../src/world/actions/rest-action';
import { SummonAction } from '../src/world/actions/summon-action';
import { WalkAction } from '../src/world/actions/walk-action';
import { Boss, Breeds, breedsForDepth } from '../src/world/breeds';
import { Game } from '../src/world/game';
import { Monster } from '../src/world/monster';
import { gameWith, rest } from './helpers';

/** A game whose very first floor is the last one, so the boss is there from the start. */
function lastFloor(seed: number): Game {
  const game = new Game(seed);
  while (game.depth < 10) game.descend();
  return game;
}

describe('the last floor', () => {
  it('has no stairs, and the boss waits at its far end', () => {
    const game = lastFloor(5);
    const { boss } = game;

    expect(game.stage.tiles.values().some((tile) => tile.isExit)).toBe(false);
    expect(boss?.breed).toBe(Boss);
    expect(game.stage.actors).toContain(boss);
  });

  it('places the boss identically for the same seed', () => {
    expect(`${lastFloor(9).boss?.pos}`).toBe(`${lastFloor(9).boss?.pos}`);
  });

  it('is won by killing the boss', () => {
    const game = lastFloor(5);
    const victories: number[] = [];
    game.events.on('victory', ({ turns }) => victories.push(turns));

    const boss = game.boss;
    if (!boss) throw new Error('No boss');
    game.kill(boss, game.hero);

    expect(game.status).toBe('won');
    expect(victories).toHaveLength(1);
  });

  it('does not end the game when an ordinary monster dies there', () => {
    const game = lastFloor(5);
    const monster = game.stage.actors.find((actor) => actor instanceof Monster && actor !== game.boss);
    if (!monster) throw new Error('No ordinary monster');
    game.kill(monster, game.hero);
    expect(game.status).toBe('playing');
  });
});

describe('the boss', () => {
  it('never spawns at random', () => {
    expect(breedsForDepth(10)).not.toContain(Boss);
  });

  it('chases the hero from across the map while healthy', () => {
    const { game, monster: boss } = gameWith(Boss, new Vec(20, 5));
    rest(game, 1);
    expect(boss.pos).not.toEqual(new Vec(20, 5));
  });

  it('summons a whisper next to itself every third turn once below half HP', () => {
    const { game, monster: boss } = gameWith(Boss, new Vec(15, 3));
    boss.hp = Math.floor(Boss.maxHp / 2);
    const actions = [0, 1, 2, 3, 4, 5].map(() => {
      const action = Boss.behavior.nextAction(boss, game);
      rest(game, 1);
      return action.constructor;
    });
    expect(actions.filter((type) => type === SummonAction)).toHaveLength(2);
    expect(actions.filter((type) => type === WalkAction || type === RestAction)).toHaveLength(4);
  });

  it('adds the summoned monster on a free neighbouring cell', () => {
    const { game, monster: boss } = gameWith(Boss, new Vec(15, 3));
    const summons: Monster[] = [];
    game.events.on('summon', ({ summoned }) => summons.push(summoned as Monster));

    new SummonAction(boss, Breeds.whisper).perform(game);

    const [whisper] = summons;
    expect(whisper?.breed).toBe(Breeds.whisper);
    expect(game.stage.actors).toContain(whisper);
    const { x, y } = whisper?.pos ?? new Vec(0, 0);
    expect(Math.abs(x - 15) + Math.abs(y - 3)).toBe(1);
  });

  it('cannot summon when boxed in', () => {
    const { game, monster: boss } = gameWith(Boss, new Vec(1, 2));
    // (1, 1) is the hero, (0, 2) is a wall; block the other two sides.
    game.stage.addActor(new Monster(Breeds.whisper, new Vec(2, 2)));
    game.stage.addActor(new Monster(Breeds.whisper, new Vec(1, 3)));

    expect(new SummonAction(boss, Breeds.whisper).perform(game).type).toBe('failure');
  });
});
