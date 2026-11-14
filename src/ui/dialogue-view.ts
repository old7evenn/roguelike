import type { Display } from './display';
import { type Line, speakerNames } from './story';
import { theme } from './theme';

const LINE_SPACING = 2;

/**
 * Speaker names right-aligned in their own color against a shared edge, text to
 * the right of it, so a conversation reads as two clear voices.
 */
export function drawDialogue(display: Display, lines: readonly Line[], top: number): void {
  const edge = Math.round(display.columns * 0.3);
  lines.forEach((line, i) => {
    const y = top + i * LINE_SPACING;
    display.drawText(edge, y, speakerNames[line.speaker], {
      color: theme.speakers[line.speaker],
      align: 'right',
    });
    display.drawText(edge + 1, y, line.text, { color: theme.text, scale: 1.1 });
  });
}

/** The rows `drawDialogue` writes to, so callers can keep the starfield off them. */
export function dialogueRows(lines: readonly Line[], top: number): number[] {
  return lines.map((_, i) => top + i * LINE_SPACING);
}
