import { deriveSeed, randomSeed } from '../core/rng';
import { Tile, type Point } from '../core/grid';
import { generateFloor, type Floor } from '../gen/dungeon';

/**
 * Увесь стан гри + чиста функція update(state, action) → новий стан.
 *
 * Чому так (схоже на reducer у Redux):
 *  - логіку можна тестувати без браузера і canvas;
 *  - рендерер лише ЧИТАЄ стан, тож його можна замінити (Canvas → three.js), не чіпаючи гру;
 *  - гра покрокова: світ змінюється тільки у відповідь на дію гравця.
 */

export const MAX_FLOOR = 10;

export type Screen = 'title' | 'playing' | 'won';

export interface GameState {
  screen: Screen;
  runSeed: number;
  floorIndex: number; // 1..MAX_FLOOR
  floor: Floor;
  player: Point;
  turn: number;
  message: string;
}

export type Action =
  | { type: 'start' }
  | { type: 'newRun'; seed?: number }
  | { type: 'move'; dx: number; dy: number }
  | { type: 'wait' };

export function floorSeed(runSeed: number, floorIndex: number): number {
  return deriveSeed(runSeed, floorIndex);
}

export function createGame(runSeed: number): GameState {
  const floor = generateFloor(floorSeed(runSeed, 1));
  return {
    screen: 'title',
    runSeed,
    floorIndex: 1,
    floor,
    player: { ...floor.start },
    turn: 0,
    message: '',
  };
}

export function update(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'newRun':
      return createGame(action.seed ?? randomSeed());

    case 'start':
      if (state.screen === 'title') {
        return { ...state, screen: 'playing', message: 'Знайди сходи вниз (>).' };
      }
      if (state.screen === 'won') return createGame(randomSeed());
      return state;

    case 'wait':
      if (state.screen !== 'playing') return state;
      return { ...state, turn: state.turn + 1, message: '' };

    case 'move':
      if (state.screen !== 'playing') return state;
      return tryMove(state, action.dx, action.dy);
  }
}

function tryMove(state: GameState, dx: number, dy: number): GameState {
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  const { grid } = state.floor;

  if (!grid.isWalkable(nx, ny)) {
    // Удар об стіну не витрачає хід — так роблять більшість roguelike.
    return { ...state, message: 'Тут стіна.' };
  }

  const moved: GameState = { ...state, player: { x: nx, y: ny }, turn: state.turn + 1, message: '' };
  return grid.get(nx, ny) === Tile.Stairs ? descend(moved) : moved;
}

function descend(state: GameState): GameState {
  if (state.floorIndex >= MAX_FLOOR) {
    return { ...state, screen: 'won', message: '' };
  }
  const floorIndex = state.floorIndex + 1;
  const floor = generateFloor(floorSeed(state.runSeed, floorIndex));
  return {
    ...state,
    floorIndex,
    floor,
    player: { ...floor.start },
    message: `Поверх ${floorIndex}.`,
  };
}
