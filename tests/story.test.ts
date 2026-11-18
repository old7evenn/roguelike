import { describe, expect, it } from 'vitest';
import type { Display } from '../src/ui/display';
import type { Screen } from '../src/ui/screen';
import { InterludeScreen } from '../src/ui/screens/interlude-screen';
import { endingLines, interludeForDepth, interludes } from '../src/ui/story';

const emptyScreen: Screen = {
  handleInput: () => false,
  render: (_display: Display) => undefined,
};

describe('story interludes', () => {
  it('appear at the four turning points of the descent', () => {
    expect(interludes.map((interlude) => interlude.depth)).toEqual([1, 4, 7, 10]);
    expect(interludeForDepth(4)?.title).toBe('ВІДЛУННЯ');
    expect(interludeForDepth(5)).toBeUndefined();
  });

  it('give both speakers something to say and end with a reply', () => {
    for (const interlude of interludes) {
      const speakers = new Set(interlude.lines.map((line) => line.speaker));
      expect(speakers).toEqual(new Set(['voice', 'hero']));
      expect(interlude.lines.every((line) => line.text.length > 0)).toBe(true);
    }
    expect(endingLines.map((line) => line.speaker)).toEqual(['voice', 'hero']);
  });

  it('continues only on confirm or cancel', () => {
    const interlude = interludeForDepth(1);
    if (!interlude) throw new Error('Missing first interlude');
    let current: Screen | null = null;
    const navigation = { goTo: (screen: Screen) => (current = screen) };
    const screen = new InterludeScreen(navigation, 1234, interlude, emptyScreen);

    expect(screen.handleInput('north')).toBe(false);
    expect(current).toBeNull();
    expect(screen.handleInput('confirm')).toBe(true);
    expect(current).toBe(emptyScreen);
  });

  it('renders the floor, title, dialogue and continue hint', () => {
    const interlude = interludeForDepth(7);
    if (!interlude) throw new Error('Missing seventh-floor interlude');
    const drawn: string[] = [];
    const display: Display = {
      columns: 86,
      rows: 41,
      clear: () => undefined,
      drawGlyph: () => undefined,
      drawSprite: () => undefined,
      drawText: (_x, _y, text) => {
        drawn.push(text);
      },
      fillRect: () => undefined,
      strokeRect: () => undefined,
    };
    const screen = new InterludeScreen({ goTo: () => undefined }, 1234, interlude, emptyScreen);

    screen.render(display);

    expect(drawn).toContain('ПОВЕРХ 7 / 10');
    expect(drawn).toContain('ДИХАННЯ');
    expect(drawn).toContain('Мені страшно.');
    expect(drawn).toContain('Enter / Esc — далі');
  });
});
