import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import type { Game } from '../../world/game';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { theme } from '../theme';
import type { Ui } from '../ui';
import { TitleScreen } from './title-screen';

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
    const centerY = Math.floor(display.rows / 2);
    const summary = `${config.maxDepth} поверхів за ${this.game.turns} ходів`;

    display.drawText(centerX, centerY - 4, 'ПЕРЕМОГА', { color: theme.accent, scale: 3.5, align: 'center' });
    display.drawText(centerX, centerY, summary, { color: theme.text, scale: 1.25, align: 'center' });
    display.drawText(centerX, centerY + 2, `seed: ${this.game.seed}`, { color: theme.dim, align: 'center' });
    display.drawText(centerX, centerY + 5, 'Enter — нова гра', { color: theme.text, align: 'center' });
  }
}
