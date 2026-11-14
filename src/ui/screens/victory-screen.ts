import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import { Vec } from '../../engine/vec';
import type { Game } from '../../world/game';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { drawStars, rowRange } from '../starfield';
import { ending } from '../story';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';
import { TitleScreen } from './title-screen';

const GROUND_WIDTH = 31;

export class VictoryScreen implements Screen {
  private readonly ui: Ui;
  private readonly game: Game;

  constructor(ui: Ui, game: Game) {
    this.ui = ui;
    this.game = game;
  }

  handleInput(input: Input): boolean {
    if (input !== 'confirm' && input !== 'newGame') return false;
    this.ui.goTo(new TitleScreen(this.ui, randomSeed()));
    return true;
  }

  render(display: Display): void {
    const centerX = display.columns / 2;
    const left = Math.round(centerX - GROUND_WIDTH / 2);
    const summary = `${config.maxDepth} поверхів · ${this.game.turns} ходів`;
    drawStars(display, this.game.seed, new Set([...rowRange(6, 10), 13, 15, 24, 26, 29]));

    display.drawText(centerX, 8, 'ТИ НА ДНІ', { color: theme.accent, scale: 3, align: 'center' });
    ending.forEach((line, i) => {
      display.drawText(centerX, 13 + i * 2, line, { color: theme.text, scale: 1.25, align: 'center' });
    });

    // The last step of the title screen's staircase, now level ground.
    const { wall } = tileGlyphs(config.maxDepth);
    for (let i = 0; i < GROUND_WIDTH; i++) {
      display.drawGlyph(new Vec(left + i, 20), { char: '', fg: wall.fg, bg: wall.fg });
    }
    display.drawGlyph(new Vec(Math.floor(centerX), 19), theme.hero);

    display.drawText(centerX, 24, summary, { color: theme.dim, align: 'center' });
    display.drawText(centerX, 26, `seed ${this.game.seed}`, { color: theme.dim, align: 'center' });
    display.drawText(centerX, 29, 'Enter — ще одна ніч', { color: theme.text, align: 'center' });
  }
}
