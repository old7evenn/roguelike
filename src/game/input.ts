import type { Action, Screen } from './state';

/**
 * Перетворює натискання клавіші на ігрову дію.
 * Використовуємо event.code (фізична клавіша), а не event.key,
 * щоб WASD працював і на українській розкладці (там W — це «Ц»).
 */
const MOVES: Record<string, readonly [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};

export function keyToAction(code: string, screen: Screen): Action | null {
  if (screen === 'title' || screen === 'won') {
    if (code === 'Enter' || code === 'Space') return { type: 'start' };
    if (code === 'KeyN') return { type: 'newRun' };
    return null;
  }

  const move = MOVES[code];
  if (move) return { type: 'move', dx: move[0], dy: move[1] };
  if (code === 'Period' || code === 'Space') return { type: 'wait' };
  if (code === 'KeyN') return { type: 'newRun' };
  return null;
}
