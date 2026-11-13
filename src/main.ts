import { randomSeed, seedFromString } from './core/rng';
import { DEFAULT_GEN } from './gen/dungeon';
import { keyToAction } from './game/input';
import { createGame, MAX_FLOOR, update, type GameState } from './game/state';
import { CanvasRenderer } from './render/canvas';

/**
 * Точка входу: зчитує seed з URL, створює гру й рендерер, слухає клавіатуру.
 *
 * Ігровий цикл: requestAnimationFrame викликає frame() перед кожним
 * перемальовуванням екрана (~60 разів/с). Гра покрокова, тож малюємо
 * лише якщо стан змінився (`dirty`) — CPU не працює даремно.
 */

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const hud = document.querySelector<HTMLDivElement>('#hud')!;
const renderer = new CanvasRenderer(canvas, DEFAULT_GEN.width, DEFAULT_GEN.height);

const params = new URLSearchParams(location.search);
const seedParam = params.get('seed');
let state: GameState = createGame(seedParam ? seedFromString(seedParam) : randomSeed());
let dirty = true;

window.addEventListener('keydown', (event) => {
  if (event.repeat && state.screen !== 'playing') return;
  const action = keyToAction(event.code, state.screen);
  if (!action) return;
  event.preventDefault(); // стрілки не повинні скролити сторінку
  state = update(state, action);
  dirty = true;
});

window.addEventListener('resize', () => {
  renderer.resize();
  dirty = true;
});

function syncUrl(seed: number): void {
  const url = new URL(location.href);
  if (url.searchParams.get('seed') === String(seed)) return;
  url.searchParams.set('seed', String(seed));
  history.replaceState(null, '', url); // посилання з ?seed=… можна надіслати другу
}

function renderHud(s: GameState): void {
  const info =
    s.screen === 'playing'
      ? `Поверх ${s.floorIndex}/${MAX_FLOOR} · Хід ${s.turn} · seed ${s.runSeed}`
      : `seed ${s.runSeed}`;
  hud.innerHTML = '';
  const left = document.createElement('span');
  left.textContent = s.message ? `${info} — ${s.message}` : info;
  const right = document.createElement('span');
  right.className = 'hint';
  right.textContent = 'WASD / стрілки — рух · . — чекати · N — нова гра';
  hud.append(left, right);
}

function frame(): void {
  if (dirty) {
    renderer.draw(state);
    renderHud(state);
    syncUrl(state.runSeed);
    dirty = false;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
