import { describe, expect, it } from 'vitest';
import { bfsDistances } from '../src/gen/connectivity';
import { DIRS4, type Point } from '../src/core/grid';
import { createGame, MAX_FLOOR, update, type GameState } from '../src/game/state';

/** Знаходить шлях до сходів (BFS у зворотному напрямку) і проходить його діями 'move'. */
function walkToStairs(state: GameState): GameState {
  const { grid, stairs } = state.floor;
  const dist = bfsDistances(grid, stairs);
  let s = state;
  let guard = 10_000;
  while (s.floorIndex === state.floorIndex && s.screen === 'playing' && guard-- > 0) {
    const p: Point = s.player;
    const here = dist[grid.index(p.x, p.y)]!;
    const step = DIRS4.find((d) => {
      const nx = p.x + d.x;
      const ny = p.y + d.y;
      return grid.isWalkable(nx, ny) && dist[grid.index(nx, ny)] === here - 1;
    })!;
    s = update(s, { type: 'move', dx: step.x, dy: step.y });
  }
  return s;
}

describe('game state', () => {
  it('starts on the title screen and moves to playing on start', () => {
    const s = createGame(7);
    expect(s.screen).toBe('title');
    expect(update(s, { type: 'start' }).screen).toBe('playing');
  });

  it('bumping into a wall does not spend a turn', () => {
    let s = update(createGame(7), { type: 'start' });
    // Йдемо вгору, доки не впремося в стіну.
    for (let i = 0; i < 50; i++) s = update(s, { type: 'move', dx: 0, dy: -1 });
    const before = s.turn;
    s = update(s, { type: 'move', dx: 0, dy: -1 });
    expect(s.turn).toBe(before);
    expect(s.message).toBe('Тут стіна.');
  });

  it(`a full run reaches floor ${MAX_FLOOR} and wins, deterministically`, () => {
    const play = () => {
      let s = update(createGame(1234), { type: 'start' });
      const turnsPerFloor: number[] = [];
      while (s.screen === 'playing') {
        const t = s.turn;
        s = walkToStairs(s);
        turnsPerFloor.push(s.turn - t);
      }
      return { s, turnsPerFloor };
    };
    const a = play();
    const b = play();
    expect(a.s.screen).toBe('won');
    expect(a.turnsPerFloor).toHaveLength(MAX_FLOOR);
    expect(a.turnsPerFloor).toEqual(b.turnsPerFloor);
  });
});
