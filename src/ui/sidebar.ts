import { config } from '../config';
import { Vec } from '../engine/vec';
import type { Game } from '../world/game';
import { Monster } from '../world/monster';
import { visibleMonsters } from '../world/travel';
import { actorName, actorSprite, capitalize } from './actor-view';
import type { Display } from './display';
import { describeItem } from './item-view';
import { drawHealthBar } from './stage-view';
import { theme, tileGlyphs } from './theme';

const LEFT = config.stageWidth + 1;
const RIGHT = config.stageWidth + config.sidebarWidth - 1;
/** Beyond this the list would run into the sections below; the rest are summed up in one line. */
const MAX_LISTED = 6;
const BAR_HEIGHT = 0.4;

const CONTROLS: readonly (readonly [key: string, action: string])[] = [
  ['WASD / стрілки', 'крок або удар'],
  ['клік / тап', 'іти туди'],
  ['X', 'дослідити поверх'],
  ['E', 'до сходів'],
  ['.', 'чекати хід'],
  ['I', 'речі'],
  ['N', 'нова гра'],
];

/**
 * Everything the map alone doesn't say: hero stats, who is in sight and how hurt they
 * are, what lies around, what is under the pointer, and the keys. The map shows
 * where things are, the panel says what they are.
 */
export function drawSidebar(display: Display, game: Game, hovered: Vec | null): void {
  display.fillRect(config.stageWidth, 0, config.sidebarWidth, display.rows, theme.panel);
  let y = drawHero(display, game, 0.5);
  y = drawMonsters(display, game, y + 1);
  y = drawSights(display, game, y + 1);
  if (hovered) drawHovered(display, game, hovered, y + 1);
  drawControls(display);
}

function drawHero(display: Display, game: Game, top: number): number {
  const { hero, depth, turns, seed } = game;
  display.drawText(LEFT, top, `Поверх ${depth} з ${config.maxDepth}`, { color: theme.accent, scale: 1.15 });

  const hpTop = top + 1.5;
  const health = hero.hp / hero.maxHp;
  display.drawText(LEFT, hpTop, 'HP', { color: theme.text });
  drawHealthBar(display, LEFT + 1.6, hpTop + (1 - BAR_HEIGHT) / 2, 11, health, BAR_HEIGHT);
  display.drawText(RIGHT, hpTop, `${hero.hp}/${hero.maxHp}`, { color: theme.text, align: 'right' });

  const lines = [
    `атака ${hero.attack} · захист ${hero.defense}`,
    `огляд ${hero.sightRadius} клітинок`,
    `у руках: ${hero.weapon?.name ?? 'нічого'}`,
  ];
  lines.forEach((line, i) => {
    display.drawText(LEFT, hpTop + 1 + i, line, { color: theme.dim });
  });
  display.drawText(LEFT, hpTop + 1 + lines.length, `хід ${turns} · seed ${seed}`, { color: theme.dim });
  return hpTop + 2 + lines.length;
}

function drawMonsters(display: Display, game: Game, top: number): number {
  const monsters = visibleMonsters(game.stage, game.hero.pos);
  drawHeading(display, top, 'ПОРУЧ');
  if (monsters.length === 0) {
    display.drawText(LEFT, top + 1, 'нікого не видно', { color: theme.dim });
    return top + 2;
  }

  monsters.slice(0, MAX_LISTED).forEach((monster, i) => {
    const y = top + 1 + i;
    display.drawSprite(new Vec(LEFT, y), actorSprite(monster));
    display.drawText(LEFT + 1.4, y, actorName(monster), { color: theme.monsters[monster.breed.id].color });
    drawHealthBar(display, LEFT + 9, y + (1 - BAR_HEIGHT) / 2, 6.5, monster.hp / monster.maxHp, BAR_HEIGHT);
    display.drawText(RIGHT, y, `${monster.hp}/${monster.maxHp}`, { color: theme.dim, align: 'right' });
  });
  const hidden = monsters.length - MAX_LISTED;
  if (hidden > 0) display.drawText(LEFT, top + 1 + MAX_LISTED, `…і ще ${hidden}`, { color: theme.dim });
  return top + 2 + Math.min(monsters.length, MAX_LISTED) + (hidden > 0 ? 1 : 0);
}

/** Items in sight, plus the stairs once they are in view. */
function drawSights(display: Display, game: Game, top: number): number {
  const { stage } = game;
  const items = stage.items.filter((item) => stage.isVisible(item.pos)).slice(0, MAX_LISTED);
  const exit = [...stage.tiles.entries()].find(([pos, tile]) => tile.isExit && stage.isVisible(pos));
  if (items.length === 0 && !exit) return top;

  drawHeading(display, top, 'ВИДНО');
  let y = top + 1;
  for (const { type } of items) {
    display.drawSprite(new Vec(LEFT, y), theme.items[type.id]);
    display.drawText(LEFT + 1.4, y, describeItem(type), { color: theme.text });
    y++;
  }
  if (exit) {
    display.drawGlyph(new Vec(LEFT, y), tileGlyphs(game.depth).stairsDown);
    display.drawText(LEFT + 1.4, y, 'сходи вниз', { color: theme.stairs });
    y++;
  }
  return y + 1;
}

function drawHovered(display: Display, game: Game, cell: Vec, top: number): void {
  if (cell.x >= config.stageWidth || cell.y >= config.stageHeight) return;
  drawHeading(display, top, 'ПІД КУРСОРОМ');
  describeCell(game, cell).forEach((line, i) => {
    display.drawText(LEFT, top + 1 + i, line, { color: i === 0 ? theme.text : theme.dim });
  });
}

function describeCell(game: Game, pos: Vec): string[] {
  const { stage, hero } = game;
  if (!stage.isExplored(pos)) return ['Ще не досліджено.'];

  if (stage.isVisible(pos)) {
    const actor = stage.actorAt(pos);
    if (actor === hero) return ['Це ти.'];
    if (actor instanceof Monster) {
      return [
        capitalize(actorName(actor)),
        `HP ${actor.hp}/${actor.maxHp} · атака ${actor.attack} · захист ${actor.defense}`,
        theme.monsterNotes[actor.breed.id],
      ];
    }
    const item = stage.itemAt(pos);
    if (item) return [capitalize(describeItem(item.type)), 'наступи, щоб підібрати'];
  }

  const tile = stage.tileAt(pos);
  const what = tile.isExit ? 'Сходи вниз.' : tile.isWalkable ? 'Підлога.' : 'Стіна.';
  return stage.isVisible(pos) ? [what] : [what, "з пам'яті: що там зараз, не видно"];
}

function drawControls(display: Display): void {
  const top = display.rows - CONTROLS.length - 1.5;
  drawHeading(display, top, 'КЕРУВАННЯ');
  CONTROLS.forEach(([key, action], i) => {
    display.drawText(LEFT, top + 1 + i, key, { color: theme.text });
    display.drawText(RIGHT, top + 1 + i, action, { color: theme.dim, align: 'right' });
  });
}

function drawHeading(display: Display, y: number, text: string): void {
  display.drawText(LEFT, y, text, { color: theme.accent, scale: 0.85 });
}
