import { randomSeed } from '../../engine/rng';
import { Game } from '../../world/game';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { writeSeedToUrl } from '../seed-url';
import { theme } from '../theme';
import type { Ui } from '../ui';
import { PlayScreen } from './play-screen';

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
    const centerY = Math.floor(display.rows / 2);

    display.drawText(centerX, centerY - 5, theme.title, { color: theme.accent, scale: 3.5, align: 'center' });
    display.drawText(centerX, centerY - 2, theme.subtitle, {
      color: theme.text,
      scale: 1.25,
      align: 'center',
    });
    display.drawText(centerX, centerY + 1, `seed: ${this.seed}`, { color: theme.dim, align: 'center' });
    display.drawText(centerX, centerY + 4, 'Enter — почати   ·   N — новий seed', {
      color: theme.text,
      align: 'center',
    });
  }
}
