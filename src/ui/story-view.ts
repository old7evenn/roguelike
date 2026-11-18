import type { Display } from './display';
import type { Speaker, StoryLine } from './story';
import { theme } from './theme';

const LINE_SPACING = 3;

const speakerNames: Readonly<Record<Speaker, string>> = {
  voice: 'Голос',
  hero: 'Ти',
};

/** Speaker labels share one edge, so the two voices read as a conversation. */
export function drawStoryLines(display: Display, lines: readonly StoryLine[], top: number): void {
  const edge = Math.round(display.columns * 0.32);
  lines.forEach((line, index) => {
    const y = top + index * LINE_SPACING;
    const color = line.speaker === 'hero' ? theme.hero.color : theme.monsters.whisper.color;
    display.drawText(edge, y, speakerNames[line.speaker], { color, align: 'right' });
    display.drawText(edge + 1, y, line.text, { color: theme.text, scale: 1.1 });
  });
}

export function storyRows(lines: readonly StoryLine[], top: number): number[] {
  return lines.map((_, index) => top + index * LINE_SPACING);
}
