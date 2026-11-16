import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import { Vec } from '../../engine/vec';
import { Game } from '../../world/game';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { writeSeedToUrl } from '../seed-url';
import { drawStars, rowRange } from '../starfield';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';
import { PlayScreen } from './play-screen';

const STEP_WIDTH = 3;

export class TitleScreen implements Screen {
  private readonly ui: Ui;
  private readonly seed: number;

  constructor(ui: Ui, seed: number) {
    this.ui = ui;
    this.seed = seed;
  }

  onEnter(): void {
    writeSeedToUrl(this.seed);
  }

  handleInput(input: Input): boolean {
    switch (input) {
      case 'confirm':
        this.ui.goTo(new PlayScreen(this.ui, new Game(this.seed)));
        return true;
      case 'newGame':
        this.ui.goTo(new TitleScreen(this.ui, randomSeed()));
        return true;
      default:
        return false;
    }
  }

  render(display: Display): void {
    const centerX = display.columns / 2;
    drawStars(display, this.seed, new Set([...rowRange(3, 9), 11, 29, 31]));

    display.drawText(centerX, 6, theme.title, { color: theme.accent, scale: 4, align: 'center' });
    display.drawText(centerX, 11, theme.subtitle, { color: theme.text, scale: 1.25, align: 'center' });
    drawStaircase(display, Math.round(centerX - (config.maxDepth * STEP_WIDTH) / 2), 15);
    display.drawText(centerX, 29, 'Enter — спуститися   ·   N — інша ніч', {
      color: theme.text,
      align: 'center',
    });
    display.drawText(centerX, 31, `seed ${this.seed}`, { color: theme.dim, align: 'center' });
  }
}

/** One step per floor, each in that floor's colors: the whole descent at a glance. */
function drawStaircase(display: Display, left: number, top: number): void {
  for (let depth = 1; depth <= config.maxDepth; depth++) {
    const { wall } = tileGlyphs(depth);
    const y = top + depth - 1;
    for (let i = 0; i < STEP_WIDTH; i++) {
      const x = left + (depth - 1) * STEP_WIDTH + i;
      display.drawGlyph(new Vec(x, y), { char: '', fg: wall.fg, bg: wall.fg });
    }
  }
  display.drawSprite(new Vec(left + 1, top - 1), theme.hero);
  const bottom = top + config.maxDepth - 1;
  display.drawGlyph(new Vec(left + config.maxDepth * STEP_WIDTH, bottom), {
    char: '>',
    fg: theme.stairs,
  });
}
