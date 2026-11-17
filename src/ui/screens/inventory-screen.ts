import { Vec } from '../../engine/vec';
import type { Hero } from '../../world/hero';
import type { InventoryItemType } from '../../world/items';
import type { Display } from '../display';
import type { Input } from '../input';
import { describeItem } from '../item-view';
import type { Screen } from '../screen';
import { theme } from '../theme';
import type { Ui } from '../ui';

const WIDTH = 34;
/** Rows above the item list: title, equipped items, a gap. */
const HEADER_ROWS = 5;

interface Entry {
  readonly type: InventoryItemType;
  readonly count: number;
}

/** An overlay on top of `PlayScreen`: the game stays visible behind it. */
export class InventoryScreen implements Screen {
  private readonly ui: Ui;
  private readonly hero: Hero;
  private readonly onUse: (item: InventoryItemType) => void;
  private selected = 0;

  constructor(ui: Ui, hero: Hero, onUse: (item: InventoryItemType) => void) {
    this.ui = ui;
    this.hero = hero;
    this.onUse = onUse;
  }

  handleInput(input: Input): boolean {
    const entries = groupItems(this.hero.inventory);
    switch (input) {
      case 'north':
        this.selected = Math.max(0, this.selected - 1);
        return true;
      case 'south':
        this.selected = Math.min(entries.length - 1, this.selected + 1);
        return true;
      case 'confirm': {
        const entry = entries[this.selected];
        if (!entry) return false;
        // Close first: using the item runs a game turn, and that may end the game.
        this.ui.pop();
        this.onUse(entry.type);
        return true;
      }
      case 'cancel':
      case 'inventory':
        this.ui.pop();
        return true;
      default:
        return false;
    }
  }

  render(display: Display): void {
    const entries = groupItems(this.hero.inventory);
    const height = HEADER_ROWS + Math.max(entries.length, 1) + 3;
    const left = Math.floor((display.columns - WIDTH) / 2);
    const top = Math.floor((display.rows - height) / 2);
    drawPanel(display, left, top, height);

    const textLeft = left + 2;
    const { weapon, armor } = this.hero;
    display.drawText(left + WIDTH / 2, top + 1, 'Речі', {
      color: theme.accent,
      scale: 1.25,
      align: 'center',
    });
    display.drawText(textLeft, top + 2.5, `У руках: ${weapon ? describeItem(weapon) : 'нічого'}`, {
      color: theme.dim,
    });
    display.drawText(textLeft, top + 3.5, `На тобі: ${armor ? describeItem(armor) : 'нічого'}`, {
      color: theme.dim,
    });

    if (entries.length === 0) {
      display.drawText(textLeft, top + HEADER_ROWS, 'Порожньо.', { color: theme.dim });
    }
    entries.forEach((entry, i) => {
      const isSelected = i === this.selected;
      const count = entry.count > 1 ? ` ×${entry.count}` : '';
      display.drawText(
        textLeft,
        top + HEADER_ROWS + i,
        `${isSelected ? '›' : ' '} ${describeItem(entry.type)}${count}`,
        {
          color: isSelected ? theme.text : theme.dim,
        },
      );
    });

    display.drawText(left + WIDTH / 2, top + height - 2, '↑↓ — вибрати · Enter — взяти · Esc — закрити', {
      color: theme.dim,
      align: 'center',
    });
  }
}

/** Identical items share one line, in the order they were first picked up. */
function groupItems(items: readonly InventoryItemType[]): Entry[] {
  const counts = new Map<InventoryItemType, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts].map(([type, count]) => ({ type, count }));
}

function drawPanel(display: Display, left: number, top: number, height: number): void {
  for (let y = top; y < top + height; y++) {
    for (let x = left; x < left + WIDTH; x++) {
      const isBorder = y === top || y === top + height - 1 || x === left || x === left + WIDTH - 1;
      display.drawGlyph(new Vec(x, y), {
        char: '',
        fg: theme.faint,
        bg: isBorder ? theme.faint : theme.background,
      });
    }
  }
}
