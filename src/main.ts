import { config } from './config';
import { randomSeed } from './engine/rng';
import { CanvasDisplay } from './ui/canvas-display';
import { inputForKey, isInput } from './ui/input';
import { TitleScreen } from './ui/screens/title-screen';
import { readSeedFromUrl } from './ui/seed-url';
import { Ui } from './ui/ui';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('Missing <canvas id="game">');

const display = new CanvasDisplay(
  canvas,
  config.stageWidth + config.sidebarWidth,
  config.stageHeight + config.statusRows,
  config.cellSize,
);
const ui = new Ui(display);
ui.goTo(new TitleScreen(ui, readSeedFromUrl() ?? randomSeed()));

window.addEventListener('keydown', (event) => {
  // macOS sends no keyup for keys released while Cmd is down, so Cmd lets go of everything.
  if (event.key === 'Meta') ui.blur();
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const input = inputForKey(event.code);
  if (!input) return;
  ui.sound.unlock();
  if (ui.press(input, event.repeat)) event.preventDefault();
});

window.addEventListener('keyup', (event) => {
  const input = inputForKey(event.code);
  if (input) ui.release(input);
});

// Keyups never arrive while the window is in the background, and the monsters shouldn't keep walking either.
window.addEventListener('blur', () => ui.blur());

// On-screen buttons act on press, not on click, and holding an arrow walks like holding a key.
for (const button of document.querySelectorAll<HTMLButtonElement>('#touch [data-input]')) {
  const input = button.dataset.input;
  if (!isInput(input)) continue;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    ui.sound.unlock();
    ui.press(input, false);
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
    button.addEventListener(type, () => {
      // Touch counts as a user gesture only on release, so audio is unlocked here too.
      ui.sound.unlock();
      ui.release(input);
    });
  }
}

// Pointer events cover both the mouse and touch: hovering inspects a cell, a click or tap walks there.
canvas.addEventListener('pointermove', (event) => ui.hover(display.cellAt(event.clientX, event.clientY)));
canvas.addEventListener('pointerleave', () => ui.hover(null));
canvas.addEventListener('click', (event) => {
  ui.sound.unlock();
  const cell = display.cellAt(event.clientX, event.clientY);
  if (cell) ui.click(cell);
});

window.addEventListener('resize', () => {
  display.resize();
  ui.invalidate();
});

// Every frame the top screen may advance its clock or an animation; drawing happens only if something changed.
function frame(now: number): void {
  ui.refresh(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
