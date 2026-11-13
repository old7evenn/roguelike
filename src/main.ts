import { config } from './config';
import { randomSeed } from './engine/rng';
import { CanvasDisplay } from './ui/canvas-display';
import { inputForKey } from './ui/input';
import { TitleScreen } from './ui/screens/title-screen';
import { readSeedFromUrl } from './ui/seed-url';
import { Ui } from './ui/ui';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('Missing <canvas id="game">');

const display = new CanvasDisplay(
  canvas,
  config.stageWidth,
  config.stageHeight + config.statusRows,
  config.cellSize,
);
const ui = new Ui(display);
ui.goTo(new TitleScreen(ui, readSeedFromUrl() ?? randomSeed()));

window.addEventListener('keydown', (event) => {
  const input = inputForKey(event.code);
  if (input && ui.handleInput(input)) event.preventDefault();
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
