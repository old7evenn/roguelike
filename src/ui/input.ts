/** What the player means, independent of which key they pressed. */
export type Input = 'north' | 'south' | 'east' | 'west' | 'rest' | 'confirm' | 'newGame';

/**
 * Keyed by `KeyboardEvent.code` (physical key), not `.key`,
 * so WASD works on any layout — on Ukrainian the W key types «ц».
 */
const KEY_BINDINGS: ReadonlyMap<string, Input> = new Map([
  ['ArrowUp', 'north'],
  ['ArrowDown', 'south'],
  ['ArrowLeft', 'west'],
  ['ArrowRight', 'east'],
  ['KeyW', 'north'],
  ['KeyS', 'south'],
  ['KeyA', 'west'],
  ['KeyD', 'east'],
  ['Period', 'rest'],
  ['Enter', 'confirm'],
  ['Space', 'confirm'],
  ['KeyN', 'newGame'],
]);

export function inputForKey(code: string): Input | undefined {
  return KEY_BINDINGS.get(code);
}
