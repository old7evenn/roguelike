import { config } from '../config';
import type { BreedId } from '../world/breeds';
import type { TileName } from '../world/tile';
import { mixColors } from './color';
import type { Glyph } from './display';
import type { Speaker } from './story';

/** All presentation lives here; retheming the game never touches world code. */
export const theme = {
  title: 'ДНО',
  subtitle: 'Десять поверхів униз. Без поспіху.',
  background: '#0e0c1b',
  text: '#e8dff5',
  dim: '#7a6f99',
  faint: '#2e2848',
  accent: '#ffb3c7',
  stairs: '#8ef0d0',
  hero: { char: '@', fg: '#ffcf9f' } satisfies Glyph,
  speakers: {
    voice: '#b9a7e8',
    hero: '#ffcf9f',
  } satisfies Record<Speaker, string>,
  // The monsters are intrusive thoughts, so each glyph is the first letter of its Ukrainian name.
  monsters: {
    whisper: { char: 'ш', fg: '#b9a7e8' },
    restlessness: { char: 'н', fg: '#f2d16b' },
    reproach: { char: 'д', fg: '#ff8a80' },
    memory: { char: 'с', fg: '#8fc9ff' },
    burden: { char: 'Т', fg: '#e0607e' },
  } satisfies Record<BreedId, Glyph>,
} as const;

interface Colors {
  readonly fg: string;
  readonly bg: string;
}

type Surface = Readonly<Record<'wall' | 'floor', Colors>>;

/** The first floor is a cold night; every floor down warms a step toward dawn. */
const SURFACE_TOP: Surface = {
  wall: { fg: '#4f63a3', bg: '#222c60' },
  floor: { fg: '#2c3766', bg: '#10142c' },
};

const SURFACE_BOTTOM: Surface = {
  wall: { fg: '#c46f8f', bg: '#55264a' },
  floor: { fg: '#5a2f50', bg: '#1d1022' },
};

export function tileGlyphs(depth: number): Record<TileName, Glyph> {
  const t = (depth - 1) / (config.maxDepth - 1);
  const mix = (part: keyof Surface): Colors => ({
    fg: mixColors(SURFACE_TOP[part].fg, SURFACE_BOTTOM[part].fg, t),
    bg: mixColors(SURFACE_TOP[part].bg, SURFACE_BOTTOM[part].bg, t),
  });
  const floor = mix('floor');

  return {
    // Walls are solid blocks rather than '#': rooms read as clean silhouettes.
    wall: { char: '', ...mix('wall') },
    floor: { char: '·', ...floor },
    stairsDown: { char: '>', fg: theme.stairs, bg: floor.bg },
  };
}
