import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import { CARDINAL_DIRECTIONS, Direction, type Vec } from '../../engine/vec';
import type { Action } from '../../world/actions/action';
import { RestAction } from '../../world/actions/rest-action';
import { UseItemAction } from '../../world/actions/use-item-action';
import { WalkAction } from '../../world/actions/walk-action';
import type { Game } from '../../world/game';
import type { Monster } from '../../world/monster';
import { exploreTarget, knownExit, stepToward, visibleMonsters } from '../../world/travel';
import { actorName, capitalize } from '../actor-view';
import type { Display } from '../display';
import type { Input } from '../input';
import { MessageLog } from '../message-log';
import type { Screen } from '../screen';
import { drawSidebar } from '../sidebar';
import { drawActors, drawItems, drawStage } from '../stage-view';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';
import { GameOverScreen } from './game-over-screen';
import { InventoryScreen } from './inventory-screen';
import { TitleScreen } from './title-screen';
import { VictoryScreen } from './victory-screen';

const WALK_DIRECTIONS: Partial<Record<Input, Vec>> = {
  north: Direction.north,
  south: Direction.south,
  east: Direction.east,
  west: Direction.west,
};

/** Fast enough not to bore, slow enough to see the hero walk. */
const TRAVEL_STEP_MS = 60;

/** Where auto-travel is headed: a clicked cell, the next unexplored spot, or the stairs. */
type TravelGoal = { readonly kind: 'cell'; readonly pos: Vec } | { readonly kind: 'explore' | 'stairs' };

export class PlayScreen implements Screen {
  private readonly ui: Ui;
  private readonly game: Game;
  private readonly log = new MessageLog(config.statusRows);
  private hovered: Vec | null = null;
  private travelGoal: TravelGoal | null = null;
  private travelTimer: ReturnType<typeof setTimeout> | undefined;
  /** Monsters in sight after the last turn, to announce the ones that just appeared. */
  private monstersInSight = new Set<Monster>();

  constructor(ui: Ui, game: Game) {
    this.ui = ui;
    this.game = game;
    ui.sound.listenTo(game);
    this.say('Знайди сходи вниз. Клікни по карті, щоб іти, або X — дослідити.');

    game.events.on('message', (text) => this.say(text));
    game.events.on('depthChanged', (depth) => {
      this.say(`Поверх ${depth}. Ти витримуєш більше: макс. HP ${game.hero.maxHp}.`);
      if (depth === config.maxDepth) this.say('Сходів далі немає. Десь тут чекає відчай.');
    });
    game.events.on('summon', ({ summoner, summoned }) => {
      this.say(`${capitalize(actorName(summoner))} кличе — з'являється ${actorName(summoned)}.`);
    });
    game.events.on('attack', ({ attacker, defender, damage }) => {
      this.say(
        attacker === game.hero
          ? `Ти б'єш ${actorName(defender)} (−${damage}).`
          : `${capitalize(actorName(attacker))} б'є тебе (−${damage}).`,
      );
    });
    game.events.on('death', ({ actor }) => this.say(`${capitalize(actorName(actor))} розвіюється.`));
    game.events.on('itemPickedUp', (item) => this.say(`Підібрано: ${item.name}.`));
    game.events.on('itemUsed', (item) => {
      const { hero } = game;
      this.say(
        item.kind === 'potion'
          ? `${capitalize(item.name)}: HP ${hero.hp}/${hero.maxHp}.`
          : `Тепер у руках ${item.name}.`,
      );
    });
    game.events.on('victory', () => {
      ui.goTo(new VictoryScreen(ui, game));
    });
    game.events.on('defeat', ({ killer }) => {
      ui.goTo(new GameOverScreen(ui, game, killer));
    });
    this.noticeMonsters();
  }

  handleInput(input: Input): boolean {
    // Any key takes the controls back from auto-travel.
    const wasTravelling = this.travelGoal !== null;
    this.stopTravel();

    switch (input) {
      case 'newGame':
        this.ui.goTo(new TitleScreen(this.ui, randomSeed()));
        return true;
      case 'inventory': {
        const { hero } = this.game;
        this.ui.push(new InventoryScreen(this.ui, hero, (item) => this.act(new UseItemAction(hero, item))));
        return true;
      }
      case 'explore':
        this.startTravel({ kind: 'explore' });
        return true;
      case 'stairs':
        this.startTravel({ kind: 'stairs' });
        return true;
      case 'cancel':
        return wasTravelling;
    }

    const action = this.actionFor(input);
    if (!action) return false;
    this.act(action);
    return true;
  }

  hover(cell: Vec | null): boolean {
    const onMap = cell && cell.x < config.stageWidth && cell.y < config.stageHeight ? cell : null;
    const changed = onMap === null ? this.hovered !== null : !this.hovered?.equals(onMap);
    this.hovered = onMap;
    return changed;
  }

  /** Clicking a neighbour steps or attacks; clicking yourself waits; anything farther is travelled to. */
  click(cell: Vec): boolean {
    this.stopTravel();
    if (cell.x >= config.stageWidth || cell.y >= config.stageHeight) return false;

    const { hero } = this.game;
    if (cell.equals(hero.pos)) {
      this.act(new RestAction(hero));
      return true;
    }
    const direction = CARDINAL_DIRECTIONS.find((d) => hero.pos.add(d).equals(cell));
    if (direction) {
      this.act(new WalkAction(hero, direction));
      return true;
    }
    this.startTravel({ kind: 'cell', pos: cell });
    return true;
  }

  render(display: Display): void {
    const { stage, depth } = this.game;
    drawStage(display, stage, tileGlyphs(depth));
    drawItems(display, stage);
    drawActors(display, stage);
    if (this.hovered) display.strokeRect(this.hovered.x, this.hovered.y, 1, 1, theme.accent);
    drawSidebar(display, this.game, this.hovered, this.ui.sound.isEnabled);
    this.renderLog(display);
  }

  private act(action: Action): void {
    this.log.markAllOld();
    this.game.hero.setNextAction(action);
    this.game.update();
    this.noticeMonsters();
  }

  /** Announces monsters that have just come into view, so none sneaks up unnoticed. */
  private noticeMonsters(): void {
    const inSight = visibleMonsters(this.game.stage, this.game.hero.pos);
    const appeared = inSight.filter((monster) => !this.monstersInSight.has(monster));
    if (appeared.length > 0) this.say(`Помічено: ${appeared.map(actorName).join(', ')}.`);
    this.monstersInSight = new Set(inSight);
  }

  /**
   * Exploring and heading for the stairs refuse to start with a monster in sight:
   * walking past it on autopilot is how runs end. A clicked cell still gets one
   * step, so the mouse works in a fight too.
   */
  private startTravel(goal: TravelGoal): void {
    const nearest = visibleMonsters(this.game.stage, this.game.hero.pos)[0];
    if (goal.kind !== 'cell' && nearest) {
      this.say(`Поруч ${actorName(nearest)} — спершу розберись із ним.`);
      return;
    }
    this.travelGoal = goal;
    this.travelStep();
  }

  private stopTravel(): void {
    this.travelGoal = null;
    clearTimeout(this.travelTimer);
  }

  /** One step of auto-travel; schedules the next until something worth stopping for happens. */
  private travelStep(): void {
    const goal = this.travelGoal;
    if (!goal) return;
    const { game } = this;
    const { hero } = game;

    const target = this.travelTarget(goal);
    const direction = target && stepToward(game.stage, hero.pos, target);
    if (!direction) {
      if (goal.kind === 'cell') this.say('Туди не пройти.');
      this.stopTravel();
      return;
    }

    const { pos, hp } = hero;
    const depth = game.depth;
    this.act(new WalkAction(hero, direction));

    const interrupted =
      game.status !== 'playing' ||
      game.depth !== depth ||
      hero.pos.equals(pos) ||
      hero.hp < hp ||
      this.monstersInSight.size > 0;
    const arrived = goal.kind !== 'explore' && target.equals(hero.pos);
    if (interrupted || arrived) {
      this.stopTravel();
      return;
    }
    this.travelTimer = setTimeout(() => {
      this.travelStep();
      this.ui.invalidate();
    }, TRAVEL_STEP_MS);
  }

  private travelTarget(goal: TravelGoal): Vec | null {
    const { stage, hero, depth } = this.game;
    switch (goal.kind) {
      case 'cell':
        return goal.pos;
      case 'explore': {
        const target = exploreTarget(stage, hero.pos);
        if (!target)
          this.say(knownExit(stage) ? 'Тут усе досліджено. E — до сходів.' : 'Тут усе досліджено.');
        return target;
      }
      case 'stairs': {
        const exit = knownExit(stage);
        if (!exit) {
          this.say(depth === config.maxDepth ? 'Сходів далі немає.' : 'Сходів ще не видно. X — дослідити.');
        }
        return exit;
      }
    }
  }

  private say(text: string): void {
    this.log.add(text);
  }

  private actionFor(input: Input): Action | null {
    const { hero } = this.game;
    if (input === 'rest') return new RestAction(hero);

    const direction = WALK_DIRECTIONS[input];
    return direction ? new WalkAction(hero, direction) : null;
  }

  private renderLog(display: Display): void {
    const top = config.stageHeight;
    this.log.lines.forEach((entry, i) => {
      const count = entry.count > 1 ? ` ×${entry.count}` : '';
      // Whatever the latest input caused stands out; older lines fade.
      const color = entry.isNew ? theme.text : theme.dim;
      display.drawText(0.5, top + i, `${entry.text}${count}`, { color });
    });
  }
}
