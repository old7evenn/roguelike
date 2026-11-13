import type { BreedId } from '../world/breeds';
import type { TileName } from '../world/tile';
import type { Glyph } from './display';

/** All presentation lives here; retheming the game never touches world code. */
export const theme = {
  title: 'ROGUELIKE',
  subtitle: 'Спустись на 10-й поверх',
  background: '#0b0b10',
  text: '#c9c9d6',
  dim: '#6b6b80',
  accent: '#ffd166',
  tiles: {
    wall: { char: '#', fg: '#5b5b78', bg: '#1a1a26' },
    floor: { char: '·', fg: '#34344a', bg: '#11111a' },
    stairsDown: { char: '>', fg: '#ffd166', bg: '#11111a' },
  } satisfies Record<TileName, Glyph>,
  hero: { char: '@', fg: '#f4f4ff' } satisfies Glyph,
  monsters: {
    rat: { char: 'r', fg: '#b08968' },
    bat: { char: 'b', fg: '#9d8df1' },
    goblin: { char: 'g', fg: '#7bd389' },
    skeleton: { char: 's', fg: '#d6d0b8' },
    troll: { char: 'T', fg: '#e07a5f' },
  } satisfies Record<BreedId, Glyph>,
} as const;
