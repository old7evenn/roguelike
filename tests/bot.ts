import type { Array2D } from '../src/engine/array2d';
import { distanceMap } from '../src/engine/distance-map';
import { CARDINAL_DIRECTIONS, type Vec } from '../src/engine/vec';
import type { Action } from '../src/world/actions/action';
import { RestAction } from '../src/world/actions/rest-action';
import { UseItemAction } from '../src/world/actions/use-item-action';
import { WalkAction } from '../src/world/actions/walk-action';
import { Game } from '../src/world/game';
import type { Hero } from '../src/world/hero';
import type { PotionType, WeaponType } from '../src/world/items';
import { Monster } from '../src/world/monster';

export interface BotRun {
  readonly seed: number;
  readonly status: Game['status'] | 'stuck';
  readonly depth: number;
  readonly turns: number;
  /** Breed of whoever killed the hero, for a lost run. */
  readonly killer?: string;
}

/** A detour for an item is only worth it when the item is this close by path. */
const ITEM_DETOUR = 12;
const DRINK_BELOW = 0.4;
const MAX_TURNS = 5000;

/**
 * A plain, honest-ish player for balance checks: fights whatever stands next to
 * it, drinks when low, wields the best weapon it has, grabs nearby items, and
 * otherwise heads for the stairs (or the boss). Unlike a human it knows the whole
 * map, but it never flees, never lures monsters into corridors and never saves
 * potions for later, so a human should do at least as well.
 */
export function playBot(seed: number): BotRun {
  const game = new Game(seed);
  let killer: string | undefined;
  game.events.on('defeat', (defeat) => {
    if (defeat.killer instanceof Monster) killer = defeat.killer.breed.id;
  });
  while (game.status === 'playing' && game.turns < MAX_TURNS) {
    game.hero.setNextAction(chooseAction(game));
    game.update();
  }
  const status = game.status === 'playing' ? 'stuck' : game.status;
  return { seed, status, depth: game.depth, turns: game.turns, killer };
}

function chooseAction(game: Game): Action {
  const { hero, stage } = game;

  const neighbour = CARDINAL_DIRECTIONS.find((direction) => stage.actorAt(hero.pos.add(direction)));
  const potion = bestPotion(hero);
  if (potion && hero.hp < hero.maxHp * DRINK_BELOW) return new UseItemAction(hero, potion);
  if (neighbour) return new WalkAction(hero, neighbour);

  const weapon = bestWeapon(hero);
  if (weapon) return new UseItemAction(hero, weapon);

  const step = stepTowards(game, goal(game));
  return step ? new WalkAction(hero, step) : new RestAction(hero);
}

function bestPotion(hero: Hero): PotionType | undefined {
  const potions = hero.inventory.filter((item): item is PotionType => item.kind === 'potion');
  return potions.sort((a, b) => b.heal - a.heal)[0];
}

/** A weapon from the bag that beats the one in hand, if any. */
function bestWeapon(hero: Hero): WeaponType | undefined {
  const current = hero.weapon?.attackBonus ?? 0;
  const weapons = hero.inventory.filter((item): item is WeaponType => item.kind === 'weapon');
  return weapons
    .filter((weapon) => weapon.attackBonus > current)
    .sort((a, b) => b.attackBonus - a.attackBonus)[0];
}

function goal(game: Game): Vec {
  const { stage, hero, boss } = game;
  const fromHero = walkDistances(game, hero.pos);
  const nearItem = stage.items
    .filter((item) => fromHero.get(item.pos) <= ITEM_DETOUR)
    .sort((a, b) => fromHero.get(a.pos) - fromHero.get(b.pos))[0];
  if (nearItem) return nearItem.pos;
  if (boss) return boss.pos;

  for (const [pos, tile] of stage.tiles.entries()) if (tile.isExit) return pos;
  throw new Error(`Seed ${game.seed}: no stairs on depth ${game.depth}`);
}

/** A first step along a shortest path; other monsters block it, the target cell never does. */
function stepTowards(game: Game, target: Vec): Vec | undefined {
  const { stage, hero } = game;
  const toTarget = walkDistances(game, target);
  const here = toTarget.get(hero.pos);
  return CARDINAL_DIRECTIONS.find((direction) => {
    const next = hero.pos.add(direction);
    if (!toTarget.contains(next) || toTarget.get(next) >= here) return false;
    const occupant = stage.actorAt(next);
    return !occupant || occupant instanceof Monster;
  });
}

function walkDistances(game: Game, origin: Vec): Array2D<number> {
  const { stage } = game;
  return distanceMap(stage.width, stage.height, origin, (pos) => stage.isWalkable(pos));
}

export function summarize(runs: readonly BotRun[]): string {
  const wins = runs.filter((run) => run.status === 'won').length;
  const stuck = runs.filter((run) => run.status === 'stuck').length;
  const lost = runs.filter((run) => run.status === 'lost');
  const percent = Math.round((wins / runs.length) * 100);
  return [
    `wins ${wins}/${runs.length} (${percent}%), stuck ${stuck}`,
    `deaths by depth: ${tally(lost.map((run) => run.depth))}`,
    `killed by: ${tally(lost.map((run) => run.killer ?? '?'))}`,
  ].join('\n');
}

/** "key:count" pairs, sorted by key. */
function tally<T extends string | number>(values: readonly T[]): string {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([value, count]) => `${value}:${count}`)
    .join(' ');
}
