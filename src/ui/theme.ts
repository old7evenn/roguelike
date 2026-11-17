import { config } from '../config';
import type { BreedId } from '../world/breeds';
import type { ItemId } from '../world/items';
import type { TileName } from '../world/tile';
import { mixColors } from './color';
import type { Glyph, Sprite } from './display';

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
  /** Side panel next to the map. */
  panel: '#15122a',
  hpFull: '#8ee6a8',
  hpLow: '#ff5c8a',
  hero: { shape: 'hero', color: '#ffcf9f', size: 0.95 } satisfies Sprite,
  // The monsters are intrusive thoughts, drawn as ghosts. Size grows with how dangerous one is.
  monsters: {
    whisper: { shape: 'ghost', color: '#b9a7e8', size: 0.86 },
    restlessness: { shape: 'ghost', color: '#f2d16b', size: 0.8 },
    reproach: { shape: 'ghost', color: '#ff8a80', size: 0.92 },
    memory: { shape: 'ghost', color: '#8fc9ff', size: 0.96 },
    burden: { shape: 'ghost', color: '#e0607e', size: 1.06 },
    despair: { shape: 'horned', color: '#ff5c8a', size: 1.45 },
  } satisfies Record<BreedId, Sprite>,
  /** One line per breed for the side panel: what to expect from it. */
  monsterNotes: {
    whisper: 'слабкий, але чує тебе здалеку',
    restlessness: "швидкий, блукає навмання, ледь б'є",
    reproach: "б'є відчутно, женеться",
    memory: 'міцний, чує через пів поверху',
    burden: 'повільний, але дуже сильний',
    despair: 'бос: кличе шепіт на поміч',
  } satisfies Record<BreedId, string>,
  // Drinks are mugs, weapons are sticks: items never look like the ghosts.
  items: {
    tea: { shape: 'mug', color: '#f4a96a', size: 0.8 },
    cocoa: { shape: 'mug', color: '#c98a5e', size: 0.85 },
    pencil: { shape: 'stick', color: '#f2d16b', size: 0.8 },
    flashlight: { shape: 'stick', color: '#fff3b0', size: 0.85 },
    diary: { shape: 'stick', color: '#ffb3c7', size: 0.9 },
  } satisfies Record<ItemId, Sprite>,
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
    // A tinted cell, not just a '>', so the way down stands out from across the room.
    stairsDown: { char: '>', fg: theme.stairs, bg: mixColors(floor.bg, theme.stairs, 0.25) },
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
