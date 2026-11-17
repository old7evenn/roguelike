import { randomSeed } from '../../engine/rng';
import { Vec } from '../../engine/vec';
import type { Actor } from '../../world/actor';
import type { Game } from '../../world/game';
import { actorName, actorSprite } from '../actor-view';
import type { Display } from '../display';
import type { Input } from '../input';
import { defeatedMonsterLines, mementoSummary } from '../run-summary';
import type { Screen } from '../screen';
import { urlForSeed } from '../seed-url';
import { drawStars, rowRange } from '../starfield';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';
import { TitleScreen } from './title-screen';

export class GameOverScreen implements Screen {
  private readonly ui: Ui;
  private readonly game: Game;
  private readonly killer: Actor;

  constructor(ui: Ui, game: Game, killer: Actor) {
    this.ui = ui;
    this.game = game;
    this.killer = killer;
  }

  handleInput(input: Input): boolean {
    switch (input) {
      case 'confirm':
        // Same seed: the player gets another go at the floors that beat them.
        this.ui.goTo(new TitleScreen(this.ui, this.game.seed));
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
    const { depth, turns, seed } = this.game;
    const { wall } = tileGlyphs(depth);
    const defeated = defeatedMonsterLines(this.game);
    drawStars(display, seed, new Set([...rowRange(5, 9), 13, 16, 18, 19, 20, 21, 22, 25, 28]));

    display.drawText(centerX, 7, 'НЕ СЬОГОДНІ', { color: theme.accent, scale: 3, align: 'center' });
    display.drawSprite(new Vec(Math.floor(centerX), 13), { ...actorSprite(this.killer), size: 1.6 });
    display.drawText(centerX, 16, `Тебе здолав ${actorName(this.killer)}.`, {
      color: theme.text,
      scale: 1.25,
      align: 'center',
    });
    display.drawText(centerX, 18, `поверх ${depth} · ${turns} ходів · seed ${seed}`, {
      color: wall.fg,
      align: 'center',
    });
    display.drawText(centerX, 19, mementoSummary(this.game), { color: theme.stairs, align: 'center' });
    display.drawText(centerX, 20, 'ПОДОЛАНО', { color: theme.accent, scale: 0.85, align: 'center' });
    defeated.forEach((line, index) => {
      display.drawText(centerX, 21 + index, line, { color: theme.text, align: 'center' });
    });
    display.drawText(centerX, 25, urlForSeed(seed), { color: theme.stairs, align: 'center' });
    display.drawText(centerX, 28, 'Enter — ця сама ніч ще раз   ·   N — інша ніч', {
      color: theme.dim,
      align: 'center',
    });
  }
}
