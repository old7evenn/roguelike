import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import { Vec } from '../../engine/vec';
import type { Game } from '../../world/game';
import { dialogueRows, drawDialogue } from '../dialogue-view';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { drawStars, rowRange } from '../starfield';
import { ending } from '../story';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';
import { TitleScreen } from './title-screen';

const GROUND_WIDTH = 31;
const DIALOGUE_TOP = 11;

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
    const textRows = [...rowRange(4, 8), ...dialogueRows(ending, DIALOGUE_TOP), 26, 28, 31];
    drawStars(display, this.game.seed, new Set(textRows));

    display.drawText(centerX, 6, 'ТИ НА ДНІ', { color: theme.accent, scale: 3, align: 'center' });
    drawDialogue(display, ending, DIALOGUE_TOP);

    // The last step of the title screen's staircase, now level ground.
    const { wall } = tileGlyphs(config.maxDepth);
    for (let i = 0; i < GROUND_WIDTH; i++) {
      display.drawGlyph(new Vec(left + i, 22), { char: '', fg: wall.fg, bg: wall.fg });
    }
    display.drawGlyph(new Vec(Math.floor(centerX), 21), theme.hero);

    display.drawText(centerX, 26, summary, { color: theme.dim, align: 'center' });
    display.drawText(centerX, 28, `seed ${this.game.seed}`, { color: theme.dim, align: 'center' });
    display.drawText(centerX, 31, 'Enter — ще одна ніч', { color: theme.text, align: 'center' });
  }
}
