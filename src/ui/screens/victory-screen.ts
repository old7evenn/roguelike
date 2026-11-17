import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import { Vec } from '../../engine/vec';
import type { Game } from '../../world/game';
import type { Display } from '../display';
import type { Input } from '../input';
import { defeatedMonsterLines } from '../run-summary';
import type { Screen } from '../screen';
import { urlForSeed } from '../seed-url';
import { drawStars, rowRange } from '../starfield';
import { endingLines } from '../story';
import { drawStoryLines, storyRows } from '../story-view';
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
    const { seed, turns } = this.game;
    const summary = `${config.maxDepth} поверхів · ${turns} ходів · seed ${seed}`;
    const defeated = defeatedMonsterLines(this.game);
    const textRows = [...rowRange(5, 9), ...storyRows(endingLines, 17), 23, 25, 26, 27, 30, 33];
    drawStars(display, seed, new Set(textRows));

    display.drawText(centerX, 7, 'ТИ НА ДНІ', { color: theme.accent, scale: 3, align: 'center' });

    // The last step of the title screen's staircase, now level ground.
    const { wall } = tileGlyphs(config.maxDepth);
    for (let i = 0; i < GROUND_WIDTH; i++) {
      display.drawGlyph(new Vec(left + i, 14), { char: '', fg: wall.fg, bg: wall.fg });
    }
    display.drawSprite(new Vec(Math.floor(centerX), 13), theme.hero);

    drawStoryLines(display, endingLines, 17);
    display.drawText(centerX, 23, summary, { color: theme.text, scale: 1.25, align: 'center' });
    display.drawText(centerX, 25, 'ПОДОЛАНО', { color: theme.accent, scale: 0.85, align: 'center' });
    defeated.forEach((line, index) => {
      display.drawText(centerX, 26 + index, line, { color: theme.text, align: 'center' });
    });
    display.drawText(centerX, 30, urlForSeed(seed), { color: theme.stairs, align: 'center' });
    display.drawText(centerX, 33, 'Enter — ще одна ніч', { color: theme.text, align: 'center' });
  }
}
