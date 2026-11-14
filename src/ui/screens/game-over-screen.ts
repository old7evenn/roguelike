import { randomSeed } from '../../engine/rng';
import { Vec } from '../../engine/vec';
import type { Actor } from '../../world/actor';
import type { Game } from '../../world/game';
import { actorGlyph, actorName } from '../actor-view';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
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
    drawStars(display, seed, new Set([...rowRange(7, 11), 15, 18, 20, 23]));

    display.drawText(centerX, 9, 'НЕ СЬОГОДНІ', { color: theme.accent, scale: 3, align: 'center' });
    display.drawGlyph(new Vec(Math.floor(centerX), 15), actorGlyph(this.killer));
    display.drawText(centerX, 18, `Тебе здолав ${actorName(this.killer)}.`, {
      color: theme.text,
      scale: 1.25,
      align: 'center',
    });
    display.drawText(centerX, 20, `поверх ${depth} · ${turns} ходів · seed ${seed}`, {
      color: wall.fg,
      align: 'center',
    });
    display.drawText(centerX, 23, 'Enter — ця сама ніч ще раз   ·   N — інша ніч', {
      color: theme.dim,
      align: 'center',
    });
  }
}
