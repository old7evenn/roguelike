/**
 * Тема гри: символи й кольори. Щоб змінити сетинг (бункер, космостанція, ліс),
 * достатньо поміняти цей файл — логіка гри від нього не залежить.
 */
export const THEME = {
  title: 'ROGUELIKE',
  subtitle: 'Спустись на 10-й поверх',
  background: '#0b0b10',
  wall: { glyph: '#', fg: '#5b5b78', bg: '#1a1a26' },
  floor: { glyph: '·', fg: '#34344a', bg: '#11111a' },
  stairs: { glyph: '>', fg: '#ffd166', bg: '#11111a' },
  player: { glyph: '@', fg: '#f4f4ff' },
  text: '#c9c9d6',
  dim: '#6b6b80',
  accent: '#ffd166',
} as const;
