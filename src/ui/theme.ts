import { config } from '../config';
import type { BreedId } from '../world/breeds';
import type { ItemId } from '../world/items';
import type { TileName } from '../world/tile';
import { mixColors } from './color';
import type { Glyph } from './display';

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
  // The monsters are intrusive thoughts, so each glyph is the first letter of its Ukrainian name.
  monsters: {
    whisper: { char: 'ш', fg: '#b9a7e8' },
    restlessness: { char: 'н', fg: '#f2d16b' },
    reproach: { char: 'д', fg: '#ff8a80' },
    memory: { char: 'с', fg: '#8fc9ff' },
    burden: { char: 'Т', fg: '#e0607e' },
    despair: { char: 'В', fg: '#ff5c8a' },
  } satisfies Record<BreedId, Glyph>,
  // Classic roguelike shapes: '!' is something to drink, '/' something to hold.
  items: {
    tea: { char: '!', fg: '#f4a96a' },
    cocoa: { char: '!', fg: '#c98a5e' },
    pencil: { char: '/', fg: '#f2d16b' },
    flashlight: { char: '/', fg: '#fff3b0' },
    diary: { char: '/', fg: '#ffb3c7' },
  } satisfies Record<ItemId, Glyph>,
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

/** How a tile looks once it's out of sight: sunk halfway into the background. */
export function rememberedGlyph(glyph: Glyph): Glyph {
  return {
    char: glyph.char,
    fg: mixColors(glyph.fg, theme.background, 0.5),
    bg: glyph.bg && mixColors(glyph.bg, theme.background, 0.5),
  };
}
