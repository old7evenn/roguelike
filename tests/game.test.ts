import { describe, expect, it } from 'vitest';
import { config } from '../src/config';
import { distanceMap } from '../src/engine/distance-map';
import { CARDINAL_DIRECTIONS, Direction, type Vec } from '../src/engine/vec';
import { WalkAction } from '../src/world/actions/walk-action';
import { Game } from '../src/world/game';

function act(game: Game, direction: Vec): void {
  game.hero.setNextAction(new WalkAction(game.hero, direction));
  game.update();
}

/** Monsters can block the corridor and there is no combat to clear them, so these tests remove them. */
function clearMonsters(game: Game): void {
  for (const actor of [...game.stage.actors]) if (actor !== game.hero) game.stage.removeActor(actor);
}

function exitOf(game: Game): Vec {
  for (const [pos, tile] of game.stage.tiles.entries()) if (tile.isExit) return pos;
  throw new Error('Stage has no exit');
}

/** Follows the distance map downhill from the hero to the stairs. */
function walkToExit(game: Game): void {
  const { tiles } = game.stage;
  const toExit = distanceMap(tiles.width, tiles.height, exitOf(game), (pos) => tiles.get(pos).isWalkable);
  const depth = game.depth;
  clearMonsters(game);

  while (game.depth === depth && game.status === 'playing') {
    const here = toExit.get(game.hero.pos);
    const step = CARDINAL_DIRECTIONS.find((direction) => {
      const next = game.hero.pos.add(direction);
      return tiles.contains(next) && toExit.get(next) === here - 1;
    });
    if (!step) throw new Error(`Stuck at ${game.hero.pos}`);
    act(game, step);
  }
}

function playThrough(seed: number): Game {
  const game = new Game(seed);
  while (game.status === 'playing') walkToExit(game);
  return game;
}

describe('Game', () => {
  it('does not spend a turn when walking into a wall', () => {
    const game = new Game(7);
    const messages: string[] = [];
    game.events.on('message', (text) => messages.push(text));

    for (let i = 0; i < config.stageHeight; i++) act(game, Direction.north);
    const turns = game.turns;
    act(game, Direction.north);

    expect(game.turns).toBe(turns);
    expect(messages.at(-1)).toBe('Тут стіна.');
  });

  it('moves to the next depth when the hero steps onto the stairs', () => {
    const game = new Game(7);
    const depths: number[] = [];
    game.events.on('depthChanged', (depth) => depths.push(depth));

    walkToExit(game);

    expect(game.depth).toBe(2);
    expect(depths).toEqual([2]);
  });

  it(`wins after depth ${config.maxDepth}, identically for the same seed`, () => {
    const a = playThrough(1234);
    const b = playThrough(1234);

    expect(a.status).toBe('won');
    expect(a.depth).toBe(config.maxDepth);
    expect(a.turns).toBe(b.turns);
  });
});
