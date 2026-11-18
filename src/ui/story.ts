export type Speaker = 'voice' | 'hero';

export interface StoryLine {
  readonly speaker: Speaker;
  readonly text: string;
}

export interface Interlude {
  readonly depth: number;
  readonly title: string;
  readonly lines: readonly StoryLine[];
}

const voice = (text: string): StoryLine => ({ speaker: 'voice', text });
const hero = (text: string): StoryLine => ({ speaker: 'hero', text });

/** Four short pauses shape the descent without interrupting every floor. */
export const interludes: readonly Interlude[] = [
  {
    depth: 1,
    title: 'ПОРІГ',
    lines: [
      voice('Ще можна повернутися.'),
      hero('Можна. Але не сьогодні.'),
      voice('Тоді не поспішай. Я все одно поруч.'),
    ],
  },
  {
    depth: 4,
    title: 'ВІДЛУННЯ',
    lines: [voice('Чуєш? Кожен крок повертається.'), hero('Нехай. Це означає, що я рухаюся.')],
  },
  {
    depth: 7,
    title: 'ДИХАННЯ',
    lines: [
      voice('Мені страшно.'),
      hero('Тоді вдих на чотири. Видих на шість.'),
      voice('Разом?'),
      hero('Разом.'),
    ],
  },
  {
    depth: 10,
    title: 'ДНО',
    lines: [voice('Якщо внизу нічого немає?'), hero('Тоді буде від чого відштовхнутися.')],
  },
];

export const endingLines: readonly StoryLine[] = [
  voice('А якщо знову стане темно?'),
  hero('Тоді ми вже знаємо дорогу.'),
];

export function interludeForDepth(depth: number): Interlude | undefined {
  return interludes.find((interlude) => interlude.depth === depth);
}
