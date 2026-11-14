import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import { Direction, type Vec } from '../../engine/vec';
import type { Action } from '../../world/actions/action';
import { RestAction } from '../../world/actions/rest-action';
import { WalkAction } from '../../world/actions/walk-action';
import type { Game } from '../../world/game';
import { actorName } from '../actor-view';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { drawActors, drawStage } from '../stage-view';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';
import { GameOverScreen } from './game-over-screen';
import { TitleScreen } from './title-screen';
import { VictoryScreen } from './victory-screen';

const WALK_DIRECTIONS: Partial<Record<Input, Vec>> = {
  north: Direction.north,
  south: Direction.south,
  east: Direction.east,
  west: Direction.west,
};

const CONTROLS_HINT = 'WASD / стрілки — рух · . — чекати · N — нова гра';

export class PlayScreen implements Screen {
  private readonly ui: Ui;
  private readonly game: Game;
  private message = 'Сходи вниз позначено >.';

  constructor(ui: Ui, game: Game) {
    this.ui = ui;
    this.game = game;

    game.events.on('message', (text) => this.say(text));
    game.events.on('attack', ({ attacker, defender, damage }) => {
      this.say(
        attacker === game.hero
          ? `Ти б'єш ${actorName(defender)} (−${damage}).`
          : `${capitalize(actorName(attacker))} б'є тебе (−${damage}).`,
      );
    });
    game.events.on('death', ({ actor }) => this.say(`${capitalize(actorName(actor))} розвіюється.`));
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

    const action = this.actionFor(input);
    if (!action) return false;

    this.message = '';
    this.game.hero.setNextAction(action);
    this.game.update();
    return true;
  }

  render(display: Display): void {
    const glyphs = tileGlyphs(this.game.depth);
    drawStage(display, this.game.stage, glyphs);
    drawActors(display, this.game.stage, glyphs);
    this.renderStatusBar(display);
  }

  /** One turn can produce several messages (a hit and the counter-hit), so they accumulate until the next input. */
  private say(text: string): void {
    this.message = this.message ? `${this.message} ${text}` : text;
  }

  private actionFor(input: Input): Action | null {
    const { hero } = this.game;
    if (input === 'rest') return new RestAction(hero);

    const direction = WALK_DIRECTIONS[input];
    return direction ? new WalkAction(hero, direction) : null;
  }

  private renderStatusBar(display: Display): void {
    const { depth, turns, seed, hero } = this.game;
    const top = config.stageHeight;

    display.drawText(0.5, top, `Поверх ${depth}/${config.maxDepth} · HP ${hero.hp}/${hero.maxHp}`, {
      color: tileGlyphs(depth).wall.fg,
    });
    display.drawText(display.columns - 0.5, top, `Хід ${turns} · seed ${seed}`, {
      color: theme.dim,
      align: 'right',
    });
    display.drawText(0.5, top + 1, this.message, { color: theme.text });
    display.drawText(display.columns - 0.5, top + 1, CONTROLS_HINT, { color: theme.dim, align: 'right' });
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
