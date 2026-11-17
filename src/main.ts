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
  const input = inputForKey(event.code);
  if (!input) return;
  ui.sound.unlock();
  if (ui.handleInput(input)) event.preventDefault();
});

for (const button of document.querySelectorAll<HTMLButtonElement>('#touch [data-input]')) {
  button.addEventListener('click', () => {
    const input = button.dataset.input;
    if (isInput(input)) {
      ui.sound.unlock();
      ui.handleInput(input);
    }
  });
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

// The game is turn-based: the loop only flushes redraws requested by input.
function frame(): void {
  ui.refresh();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
