import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import { CARDINAL_DIRECTIONS, Direction, type Vec } from '../../engine/vec';
import type { Action } from '../../world/actions/action';
import { RestAction } from '../../world/actions/rest-action';
import { UseItemAction } from '../../world/actions/use-item-action';
import { WalkAction } from '../../world/actions/walk-action';
import type { Game } from '../../world/game';
import { MEMENTO_TOTAL } from '../../world/items';
import type { Monster } from '../../world/monster';
import { exploreTarget, knownExit, pathToward, stepToward, visibleMonsters } from '../../world/travel';
import { actorName, actorSprite, capitalize } from '../actor-view';
import { Animator } from '../animator';
import { withAlpha } from '../color';
import type { Display } from '../display';
import { DIRECTION_INPUTS, type Input } from '../input';
import { MessageLog } from '../message-log';
import type { Screen } from '../screen';
import { drawSidebar } from '../sidebar';
import { drawActors, drawItems, drawStage } from '../stage-view';
import { interludeForDepth } from '../story';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';
import { GameOverScreen } from './game-over-screen';
import { HelpScreen } from './help-screen';
import { InterludeScreen } from './interlude-screen';
import { InventoryScreen } from './inventory-screen';
import { TitleScreen } from './title-screen';
import { VictoryScreen } from './victory-screen';

const WALK_DIRECTIONS: Partial<Record<Input, Vec>> = {
  north: Direction.north,
  south: Direction.south,
  east: Direction.east,
  west: Direction.west,
};

/** Holding a direction takes a step this often; also the shortest gap between two hero moves. */
const STEP_MS = 130;
/**
 * A held key starts repeating after this long, so a slow single tap is still one step.
 * The OS waits about 500 ms before repeating, which is the lag this replaces.
 */
const HOLD_DELAY_MS = 170;
/** Auto-travel walks a little faster than a held key: the route is known, there is nothing to aim. */
const TRAVEL_STEP_MS = 80;
/**
 * Time doesn't wait for the player: after this long without a move the hero waits
 * a turn, so the monsters keep coming. Much slower than walking, so there is still
 * a moment to think in a fight; P pauses outright.
 */
const IDLE_TURN_MS = 500;
/** A longer gap between frames (a hidden tab, an overlay on top) doesn't count as game time. */
const MAX_FRAME_MS = 100;
/** The final blow stays on screen this long before the end screen replaces it. */
const ENDING_MS = 900;

/** Where auto-travel is headed: a clicked cell, the next unexplored spot, or the stairs. */
type TravelGoal = { readonly kind: 'cell'; readonly pos: Vec } | { readonly kind: 'explore' | 'stairs' };

/**
 * The world is turn-based; this screen gives it a clock. A turn passes when the
 * hero moves (at most once per `STEP_MS` while a key is held) or, if the player
 * does nothing, every `IDLE_TURN_MS` with the hero waiting.
 */
export class PlayScreen implements Screen {
  private readonly ui: Ui;
  private readonly game: Game;
  private readonly log = new MessageLog(config.statusRows);
  private readonly animator = new Animator();
  private hovered: Vec | null = null;
  /** Cached route to the hovered cell, recomputed when `routeKey` changes. */
  private route: Vec[] = [];
  private routeKey = '';
  private travelGoal: TravelGoal | null = null;
  /** Monsters in sight after the last turn, to announce the ones that just appeared. */
  private monstersInSight = new Set<Monster>();

  /** Game time in ms. Runs only while this screen is on top and not paused. */
  private clock = 0;
  /** The latest frame timestamp, for animations; unlike `clock`, it runs during a pause. */
  private now = 0;
  private lastFrame: number | null = null;
  private lastTurnAt = 0;
  private nextMoveAt = 0;
  /** When a direction was last pressed, to tell a tap from a hold. */
  private pressedAt = 0;
  private paused = false;
  /** A direction tapped while the hero was still mid-step, taken as soon as they can move. */
  private queued: Input | null = null;
  /**
   * Held directions that must be pressed again before they walk: after bumping a wall,
   * so the log isn't flooded, and after the stairs, so the hero doesn't stride into a new floor blind.
   */
  private readonly stale = new Set<Input>();
  private ending: { readonly screen: Screen; readonly at: number } | null = null;

  constructor(ui: Ui, game: Game) {
    this.ui = ui;
    this.game = game;
    ui.sound.listenTo(game);
    this.say('Знайди сходи вниз. Утримуй стрілку, щоб іти, або X — дослідити.');
    this.say('Час іде, навіть коли ти стоїш. P — пауза.');

    game.events.on('message', (text) => this.say(text));
    game.events.on('depthChanged', (depth) => {
      this.say(`Поверх ${depth}. Ти витримуєш більше: макс. HP ${game.hero.maxHp}.`);
      if (depth === config.maxDepth) this.say('Сходів далі немає. Десь тут чекає відчай.');
      const interlude = interludeForDepth(depth);
      if (interlude) ui.goTo(new InterludeScreen(ui, game.seed, interlude, this));
    });
    game.events.on('summon', ({ summoner, summoned }) => {
      this.say(`${capitalize(actorName(summoner))} кличе — з'являється ${actorName(summoned)}.`);
    });
    game.events.on('monsterAlerted', (monster) => {
      if (!game.stage.isVisible(monster.pos)) return;
      this.say(`${capitalize(actorName(monster))} помічає тебе.`);
      this.animator.floatText(monster.pos, '!', theme.accent, this.now);
    });
    game.events.on('attack', ({ attacker, defender, damage }) => {
      const heroHurt = defender === game.hero;
      this.say(
        heroHurt
          ? `${capitalize(actorName(attacker))} б'є тебе (−${damage}).`
          : `Ти б'єш ${actorName(defender)} (−${damage}).`,
      );
      this.animator.lunge(attacker, defender, this.now);
      this.animator.floatText(defender.pos, `−${damage}`, heroHurt ? theme.hpLow : theme.text, this.now);
      if (heroHurt) this.animator.flash(theme.hpLow, this.now);
    });
    game.events.on('death', ({ actor }) => {
      this.say(`${capitalize(actorName(actor))} розвіюється.`);
      this.animator.fadeOut(actor, actorSprite(actor), this.now);
    });
    game.events.on('itemPickedUp', (item) => {
      if (item.kind === 'memento') {
        this.say(`Знайдено якір: ${item.name}. ${item.memory}`);
        if (game.hero.mementos.length === MEMENTO_TOTAL) {
          this.say('Усі три якорі з тобою. Спокій додає 1 до захисту.');
        }
      } else {
        this.say(`Підібрано: ${item.name}.`);
      }
      this.animator.floatText(game.hero.pos, item.name, theme.stairs, this.now);
    });
    game.events.on('itemUsed', (item) => {
      const { hero } = game;
      switch (item.kind) {
        case 'potion':
          this.say(`${capitalize(item.name)}: HP ${hero.hp}/${hero.maxHp}.`);
          this.animator.floatText(hero.pos, `HP ${hero.hp}`, theme.hpFull, this.now);
          break;
        case 'weapon':
          this.say(`Тепер у руках ${item.name}.`);
          break;
        case 'armor':
          this.say(`Тепер на тобі ${item.name}.`);
          break;
      }
    });
    game.events.on('victory', () => {
      this.ending = { screen: new VictoryScreen(ui, game), at: this.now + ENDING_MS };
    });
    game.events.on('defeat', ({ killer }) => {
      this.ending = { screen: new GameOverScreen(ui, game, killer), at: this.now + ENDING_MS };
    });
    this.noticeMonsters();
  }

  handleInput(input: Input, isRepeat = false): boolean {
    if (this.game.status !== 'playing') return false;
    // The clock repeats steps for a held key at its own pace; the OS repeat would come too late and too fast.
    if (isRepeat) return true;

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
      case 'help':
        this.ui.push(new HelpScreen(this.ui));
        return true;
      case 'pause':
        this.paused = !this.paused;
        return true;
      case 'cancel':
        if (wasTravelling) return true;
        if (!this.paused) return false;
        this.paused = false;
        return true;
    }

    this.paused = false;
    switch (input) {
      case 'explore':
        this.startTravel({ kind: 'explore' });
        return true;
      case 'stairs':
        this.startTravel({ kind: 'stairs' });
        return true;
      case 'rest':
        if (this.clock < this.nextMoveAt) return false;
        this.act(new RestAction(this.game.hero));
        this.nextMoveAt = this.clock + STEP_MS;
        return true;
    }

    if (!WALK_DIRECTIONS[input]) return false;
    this.stale.delete(input);
    this.queued = input;
    this.pressedAt = this.clock;
    this.moveIfReady();
    return true;
  }

  update(now: number): boolean {
    const elapsed = this.lastFrame === null ? 0 : Math.min(now - this.lastFrame, MAX_FRAME_MS);
    this.lastFrame = now;
    this.now = now;

    if (this.ending) {
      if (now >= this.ending.at) this.ui.goTo(this.ending.screen);
      return this.animator.update(now);
    }

    let acted = false;
    if (!this.paused) {
      this.clock += elapsed;
      acted = this.moveIfReady();
    }
    return this.animator.update(now) || acted;
  }

  pause(): boolean {
    if (this.paused || this.game.status !== 'playing') return false;
    this.stopTravel();
    this.paused = true;
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
    if (this.game.status !== 'playing') return false;
    this.stopTravel();
    this.paused = false;
    if (cell.x >= config.stageWidth || cell.y >= config.stageHeight) return false;

    const { hero } = this.game;
    if (cell.equals(hero.pos)) {
      this.act(new RestAction(hero));
      this.nextMoveAt = this.clock + STEP_MS;
      return true;
    }
    const direction = CARDINAL_DIRECTIONS.find((d) => hero.pos.add(d).equals(cell));
    if (direction) {
      this.act(new WalkAction(hero, direction));
      this.nextMoveAt = this.clock + STEP_MS;
      return true;
    }
    this.startTravel({ kind: 'cell', pos: cell });
    return true;
  }

  render(display: Display): void {
    const { stage, depth } = this.game;
    const { now } = this;
    this.animator.follow(stage.actors, now);
    drawStage(display, stage, tileGlyphs(depth));
    this.drawRoute(display);
    drawItems(display, stage);
    drawActors(display, stage, (actor) => this.animator.positionOf(actor, now));
    this.animator.drawEffects(display, now, config.stageWidth, config.stageHeight);
    if (this.hovered) display.strokeRect(this.hovered.x, this.hovered.y, 1, 1, theme.accent);
    drawSidebar(display, this.game, this.hovered, this.ui.sound.isEnabled);
    this.renderLog(display);
    if (this.paused) this.drawPauseBanner(display);
  }

  /**
   * Takes the hero's next move once the step cooldown is over: a tapped or held
   * direction, the next auto-travel step, or — after a long enough pause — waiting.
   * Returns true if a turn passed.
   */
  private moveIfReady(): boolean {
    if (this.game.status !== 'playing' || this.clock < this.nextMoveAt) return false;

    const input = this.queued ?? this.heldDirection();
    this.queued = null;
    if (input) {
      this.step(input);
      return true;
    }
    if (this.travelGoal) {
      this.travelStep();
      return true;
    }
    if (this.clock - this.lastTurnAt >= IDLE_TURN_MS) {
      this.act(new RestAction(this.game.hero), false);
      return true;
    }
    return false;
  }

  private heldDirection(): Input | undefined {
    if (this.clock - this.pressedAt < HOLD_DELAY_MS) return undefined;
    const live = DIRECTION_INPUTS.filter((input) => !this.stale.has(input));
    return this.ui.latestHeld(live);
  }

  private step(input: Input): void {
    const direction = WALK_DIRECTIONS[input];
    if (!direction) return;
    const { game } = this;
    const { turns, depth } = game;
    this.act(new WalkAction(game.hero, direction));
    this.nextMoveAt = this.clock + STEP_MS;
    // A bump into a wall costs no turn.
    if (game.turns === turns) this.stale.add(input);
    if (game.depth !== depth) for (const held of DIRECTION_INPUTS) this.stale.add(held);
  }

  /** `byPlayer` is false for the waits the clock makes on its own; those don't fade the log. */
  private act(action: Action, byPlayer = true): void {
    if (byPlayer) this.log.markAllOld();
    this.game.hero.setNextAction(action);
    this.game.update();
    this.lastTurnAt = this.clock;
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
    if (this.clock >= this.nextMoveAt) this.travelStep();
  }

  private stopTravel(): void {
    this.travelGoal = null;
  }

  /** One step of auto-travel; the clock takes the next one until something worth stopping for happens. */
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
    this.nextMoveAt = this.clock + TRAVEL_STEP_MS;

    const interrupted =
      game.status !== 'playing' ||
      game.depth !== depth ||
      hero.pos.equals(pos) ||
      hero.hp < hp ||
      this.monstersInSight.size > 0;
    const arrived = goal.kind !== 'explore' && target.equals(hero.pos);
    if (interrupted || arrived) this.stopTravel();
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

  private renderLog(display: Display): void {
    const top = config.stageHeight;
    this.log.lines.forEach((entry, i) => {
      const count = entry.count > 1 ? ` ×${entry.count}` : '';
      // Whatever the latest input caused stands out; older lines fade.
      const color = entry.isNew ? theme.text : theme.dim;
      display.drawText(0.5, top + i, `${entry.text}${count}`, { color });
    });
  }

  /** Dots along the way a click would take, so the player sees where the hero will go. */
  private drawRoute(display: Display): void {
    const { hovered, game } = this;
    if (!hovered) return;
    const key = `${game.hero.pos} ${hovered} ${game.turns} ${game.depth}`;
    if (key !== this.routeKey) {
      this.routeKey = key;
      this.route = pathToward(game.stage, game.hero.pos, hovered);
    }
    const color = withAlpha(theme.accent, 0.55);
    for (const pos of this.route) display.fillRect(pos.x + 0.42, pos.y + 0.42, 0.16, 0.16, color);
  }

  private drawPauseBanner(display: Display): void {
    const y = config.stageHeight / 2 - 1.5;
    display.fillRect(0, y, config.stageWidth, 3, withAlpha(theme.background, 0.85));
    display.drawText(config.stageWidth / 2, y + 0.9, 'ПАУЗА', {
      color: theme.accent,
      scale: 1.4,
      align: 'center',
    });
    display.drawText(config.stageWidth / 2, y + 2, 'P, Esc або будь-яка дія — продовжити', {
      color: theme.dim,
      align: 'center',
    });
  }
}
