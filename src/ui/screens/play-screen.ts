import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import { Direction, type Vec } from '../../engine/vec';
import type { Action } from '../../world/actions/action';
import { RestAction } from '../../world/actions/rest-action';
import { UseItemAction } from '../../world/actions/use-item-action';
import { WalkAction } from '../../world/actions/walk-action';
import type { Game } from '../../world/game';
import { actorName } from '../actor-view';
import type { Display } from '../display';
import type { Input } from '../input';
import { MessageLog } from '../message-log';
import type { Screen } from '../screen';
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

const CONTROLS_HINT = 'WASD / стрілки — рух · . — чекати · I — речі · N — нова гра';
/** Every row under the map except the status line. */
const LOG_LINES = config.statusRows - 1;

export class PlayScreen implements Screen {
  private readonly ui: Ui;
  private readonly game: Game;
  private readonly log = new MessageLog(LOG_LINES);

  constructor(ui: Ui, game: Game) {
    this.ui = ui;
    this.game = game;
    this.say('Сходи вниз позначено >.');

    game.events.on('message', (text) => this.say(text));
    game.events.on('depthChanged', (depth) => {
      this.say(depth === config.maxDepth ? 'Сходів далі немає. Десь тут чекає відчай.' : `Поверх ${depth}.`);
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
  }

  handleInput(input: Input): boolean {
    if (input === 'newGame') {
      this.ui.goTo(new TitleScreen(this.ui, randomSeed()));
      return true;
    }

    if (input === 'inventory') {
      const { hero } = this.game;
      this.ui.push(new InventoryScreen(this.ui, hero, (item) => this.act(new UseItemAction(hero, item))));
      return true;
    }

    const action = this.actionFor(input);
    if (!action) return false;
    this.act(action);
    return true;
  }

  render(display: Display): void {
    const glyphs = tileGlyphs(this.game.depth);
    drawStage(display, this.game.stage, glyphs);
    drawItems(display, this.game.stage, glyphs);
    drawActors(display, this.game.stage, glyphs);
    this.renderStatusBar(display);
  }

  private act(action: Action): void {
    this.log.markAllOld();
    this.game.hero.setNextAction(action);
    this.game.update();
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

  private renderStatusBar(display: Display): void {
    const { depth, turns, seed, hero, boss, stage } = this.game;
    const top = config.stageHeight;
    let status = `Поверх ${depth}/${config.maxDepth} · HP ${hero.hp}/${hero.maxHp} · атака ${hero.attack} · огляд ${hero.sightRadius}`;
    if (boss && stage.isVisible(boss.pos)) status += ` · ${actorName(boss)} ${boss.hp}/${boss.maxHp}`;

    display.drawText(0.5, top, status, { color: tileGlyphs(depth).wall.fg });
    display.drawText(display.columns - 0.5, top, `Хід ${turns} · seed ${seed}`, {
      color: theme.dim,
      align: 'right',
    });
    this.log.lines.forEach((entry, i) => {
      const count = entry.count > 1 ? ` ×${entry.count}` : '';
      // Whatever the latest input caused stands out; older lines fade.
      const color = entry.isNew ? theme.text : theme.dim;
      display.drawText(0.5, top + 1 + i, `${entry.text}${count}`, { color });
    });
    display.drawText(display.columns - 0.5, top + LOG_LINES, CONTROLS_HINT, {
      color: theme.faint,
      align: 'right',
    });
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
