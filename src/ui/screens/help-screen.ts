import { Vec } from '../../engine/vec';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { theme } from '../theme';
import type { Ui } from '../ui';

const WIDTH = 58;
const HEIGHT = 29;

const CONTROLS: readonly (readonly [key: string, action: string])[] = [
  ['WASD / стрілки / numpad', 'крок; утримуй — іти; у монстра — удар'],
  ['клік / тап', 'іти в обрану клітинку'],
  ['X', 'дослідити поверх'],
  ['E', 'іти до видимих сходів'],
  ['.', 'пропустити хід'],
  ['P', 'пауза (Esc теж знімає)'],
  ['I', 'відкрити речі'],
  ['N', 'почати новий забіг'],
  ['H / ?', 'відкрити або закрити довідку'],
];

/** An overlay that explains the controls and the visual language of the map. */
export class HelpScreen implements Screen {
  private readonly ui: Ui;

  constructor(ui: Ui) {
    this.ui = ui;
  }

  handleInput(input: Input): boolean {
    if (input !== 'cancel' && input !== 'help') return false;
    this.ui.pop();
    return true;
  }

  render(display: Display): void {
    const left = Math.floor((display.columns - WIDTH) / 2);
    const top = Math.floor((display.rows - HEIGHT) / 2);
    display.fillRect(left, top, WIDTH, HEIGHT, theme.background);
    display.strokeRect(left, top, WIDTH, HEIGHT, theme.faint);

    display.drawText(left + WIDTH / 2, top + 1, 'Довідка', {
      color: theme.accent,
      scale: 1.25,
      align: 'center',
    });

    this.drawControls(display, left, top + 3);
    this.drawMapLegend(display, left, top + 14);

    display.drawText(left + 3, top + 22, 'Час іде сам: стоїш — монстри однаково ходять.', {
      color: theme.dim,
    });
    display.drawText(left + 3, top + 23, 'Менше HP — менший радіус огляду.', { color: theme.dim });
    display.drawText(left + 3, top + 24, 'Автохід зупиниться, щойно з’явиться монстр.', { color: theme.dim });
    display.drawText(left + WIDTH / 2, top + HEIGHT - 2, 'Esc / H / ? — закрити', {
      color: theme.dim,
      align: 'center',
    });
  }

  private drawControls(display: Display, left: number, top: number): void {
    display.drawText(left + 3, top, 'КЕРУВАННЯ', { color: theme.accent, scale: 0.85 });
    CONTROLS.forEach(([key, action], index) => {
      const y = top + 1 + index;
      display.drawText(left + 3, y, key, { color: theme.text });
      display.drawText(left + 27, y, action, { color: theme.dim });
    });
  }

  private drawMapLegend(display: Display, left: number, top: number): void {
    display.drawText(left + 3, top, 'НА КАРТІ', { color: theme.accent, scale: 0.85 });

    const entries = [
      { sprite: theme.hero, text: 'Ти — світлий кружок із @.' },
      { sprite: theme.monsters.whisper, text: 'Привиди — монстри; поранені мають смужку HP.' },
      { sprite: theme.items.tea, text: 'Чашки — напої, що відновлюють HP.' },
      { sprite: theme.items.pencil, text: 'Палички — зброя з бонусом до атаки.' },
    ] as const;

    entries.forEach(({ sprite, text }, index) => {
      const y = top + 1 + index;
      display.drawSprite(new Vec(left + 3, y), sprite);
      display.drawText(left + 5, y, text, { color: theme.text });
    });

    const stairsY = top + 5;
    display.drawGlyph(new Vec(left + 3, stairsY), { char: '>', fg: theme.stairs });
    display.drawText(left + 5, stairsY, 'Сходи ведуть на наступний поверх.', { color: theme.text });
  }
}
