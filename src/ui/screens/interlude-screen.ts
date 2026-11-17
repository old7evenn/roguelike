import { config } from '../../config';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { drawStars, rowRange } from '../starfield';
import type { Interlude } from '../story';
import { drawStoryLines, storyRows } from '../story-view';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';

const DIALOGUE_TOP = 17;

/** A brief full-screen pause at a turning point in the descent. */
export class InterludeScreen implements Screen {
  private readonly ui: Pick<Ui, 'goTo'>;
  private readonly seed: number;
  private readonly interlude: Interlude;
  private readonly next: Screen;

  constructor(ui: Pick<Ui, 'goTo'>, seed: number, interlude: Interlude, next: Screen) {
    this.ui = ui;
    this.seed = seed;
    this.interlude = interlude;
    this.next = next;
  }

  handleInput(input: Input): boolean {
    if (input !== 'confirm' && input !== 'cancel') return false;
    this.ui.goTo(this.next);
    return true;
  }

  render(display: Display): void {
    const { depth, title, lines } = this.interlude;
    const centerX = display.columns / 2;
    const rows = new Set([...rowRange(5, 13), ...storyRows(lines, DIALOGUE_TOP), 32]);
    drawStars(display, this.seed ^ depth, rows);

    const color = tileGlyphs(depth).wall.fg;
    display.drawText(centerX, 6, `ПОВЕРХ ${depth} / ${config.maxDepth}`, {
      color: theme.dim,
      align: 'center',
    });
    display.drawText(centerX, 10, title, { color, scale: 3, align: 'center' });
    display.fillRect(centerX - 6, 13, 12, 0.12, color);
    drawStoryLines(display, lines, DIALOGUE_TOP);
    display.drawText(centerX, 32, 'Enter / Esc — далі', { color: theme.dim, align: 'center' });
  }
}
