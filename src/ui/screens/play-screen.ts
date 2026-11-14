import { config } from '../../config';
import { randomSeed } from '../../engine/rng';
import { Direction, type Vec } from '../../engine/vec';
import type { Action } from '../../world/actions/action';
import { RestAction } from '../../world/actions/rest-action';
import { WalkAction } from '../../world/actions/walk-action';
import type { Game } from '../../world/game';
import type { Display } from '../display';
import type { Input } from '../input';
import type { Screen } from '../screen';
import { drawActors, drawStage } from '../stage-view';
import { floorLines } from '../story';
import { theme, tileGlyphs } from '../theme';
import type { Ui } from '../ui';
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

    game.events.on('message', (text) => {
      this.message = text;
    });
    game.events.on('victory', () => {
      ui.goTo(new VictoryScreen(ui, game));
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

  private actionFor(input: Input): Action | null {
    const { hero } = this.game;
    if (input === 'rest') return new RestAction(hero);

    const direction = WALK_DIRECTIONS[input];
    return direction ? new WalkAction(hero, direction) : null;
  }

  private renderStatusBar(display: Display): void {
    const { depth, turns, seed } = this.game;
    const top = config.stageHeight;

    display.drawText(0.5, top, `Поверх ${depth}/${config.maxDepth} · Хід ${turns} · seed ${seed}`, {
      color: theme.text,
    });
    display.drawText(display.columns - 0.5, top, CONTROLS_HINT, { color: theme.dim, align: 'right' });
    // The floor's line of inner monologue stays up for the whole floor; messages below it come and go.
    display.drawText(0.5, top + 1, floorLines[depth - 1] ?? '', { color: theme.accent });
    display.drawText(0.5, top + 2, this.message, { color: theme.text });
  }
}
