/** What the player means, independent of which key they pressed. */
export type Input =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'rest'
  | 'explore'
  | 'stairs'
  | 'confirm'
  | 'cancel'
  | 'inventory'
  | 'sound'
  | 'help'
  | 'newGame';

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
  ['Numpad8', 'north'],
  ['Numpad2', 'south'],
  ['Numpad4', 'west'],
  ['Numpad6', 'east'],
  ['Period', 'rest'],
  ['Numpad5', 'rest'],
  ['KeyX', 'explore'],
  ['KeyE', 'stairs'],
  ['Enter', 'confirm'],
  ['Space', 'confirm'],
  ['Escape', 'cancel'],
  ['KeyI', 'inventory'],
  ['KeyM', 'sound'],
  ['KeyH', 'help'],
  ['Slash', 'help'],
  ['KeyN', 'newGame'],
]);

export function inputForKey(code: string): Input | undefined {
  return KEY_BINDINGS.get(code);
}

const ALL_INPUTS: ReadonlySet<string> = new Set(KEY_BINDINGS.values());

/** For the on-screen buttons, whose `data-input` attribute names an input directly. */
export function isInput(value: string | undefined): value is Input {
  return value !== undefined && ALL_INPUTS.has(value);
}
