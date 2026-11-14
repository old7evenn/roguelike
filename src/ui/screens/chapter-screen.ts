import { config } from '../../config';
import { Vec } from '../../engine/vec';
import { dialogueRows, drawDialogue } from '../dialogue-view';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { drawStars, rowRange } from '../starfield';
import { chapters } from '../story';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';

const DIALOGUE_TOP = 17;
const RULE_WIDTH = 12;

/** A title card between floors: the floor's name and a short exchange with the inner voice. */
export class ChapterScreen implements Screen {
  private readonly ui: Ui;
  private readonly depth: number;
  private readonly next: Screen;

  constructor(ui: Ui, depth: number, next: Screen) {
    this.ui = ui;
    this.depth = depth;
    this.next = next;
  }

  handleInput(input: Input): boolean {
    if (input !== 'confirm') return false;
    this.ui.goTo(this.next);
    return true;
  }

  render(display: Display): void {
    const chapter = chapters[this.depth - 1];
    if (!chapter) return;
    const centerX = display.columns / 2;
    // The name takes the floor's wall color, so the cards drift from blue to rose like the floors do.
    const { wall } = tileGlyphs(this.depth);

    const textRows = [...rowRange(6, 13), ...dialogueRows(chapter.lines, DIALOGUE_TOP), 31];
    drawStars(display, this.depth, new Set(textRows));

    display.drawText(centerX, 7, `ПОВЕРХ ${this.depth} / ${config.maxDepth}`, {
      color: theme.dim,
      align: 'center',
    });
    display.drawText(centerX, 10, chapter.name, { color: wall.fg, scale: 3, align: 'center' });
    for (let i = 0; i < RULE_WIDTH; i++) {
      const x = Math.round(centerX - RULE_WIDTH / 2) + i;
      display.drawGlyph(new Vec(x, 13), { char: '─', fg: wall.fg });
    }

    drawDialogue(display, chapter.lines, DIALOGUE_TOP);
    display.drawText(centerX, 31, 'Enter — далі', { color: theme.dim, align: 'center' });
  }
}
