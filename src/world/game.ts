import { config } from '../config';
import { EventBus } from '../engine/event-bus';
import { deriveSeed } from '../engine/rng';
import { Vec } from '../engine/vec';
import type { DungeonGenerator } from '../generation/dungeon-generator';
import { buildLevel } from '../generation/level';
import { RoomsAndCorridors } from '../generation/rooms-and-corridors';
import type { Action, ActionResult } from './actions/action';
import { Hero } from './hero';
import { Stage } from './stage';

export interface GameEvents {
  message: string;
  depthChanged: number;
  victory: { turns: number };
}

export type GameStatus = 'playing' | 'won';

export class Game {
  readonly seed: number;
  readonly hero = new Hero(new Vec(0, 0));
  readonly events = new EventBus<GameEvents>();

  private readonly generator: DungeonGenerator;
  private currentStage!: Stage;
  private currentDepth = 0;
  private currentActor = 0;
  private turnCount = 0;
  private gameStatus: GameStatus = 'playing';

  constructor(seed: number, generator: DungeonGenerator = new RoomsAndCorridors()) {
    this.seed = seed;
    this.generator = generator;
    this.enterDepth(1);
  }

  get stage(): Stage {
    return this.currentStage;
  }

  get depth(): number {
    return this.currentDepth;
  }

  get turns(): number {
    return this.turnCount;
  }

  get status(): GameStatus {
    return this.gameStatus;
  }

  /**
   * Runs actors in order until one has nothing to do — normally the hero
   * waiting for input. Call again after queueing the hero's next action.
   */
  update(): void {
    while (this.gameStatus === 'playing') {
      const actor = this.currentStage.actors[this.currentActor];
      if (!actor) return;

      const action = actor.nextAction(this);
      if (!action) return;

      const stageBefore = this.currentStage;
      const result = this.perform(action);

      if (result.type === 'failure') {
        if (actor === this.hero) {
          this.events.emit('message', result.reason);
          return; // A failed move (e.g. into a wall) does not cost the hero a turn.
        }
      } else if (actor === this.hero) {
        this.turnCount++;
      }

      // A new stage restarts the turn order at the hero.
      if (this.currentStage === stageBefore) {
        this.currentActor = (this.currentActor + 1) % this.currentStage.actors.length;
      }
    }
  }

  descend(): void {
    if (this.currentDepth >= config.maxDepth) {
      this.gameStatus = 'won';
      this.events.emit('victory', { turns: this.turnCount });
      return;
    }
    this.enterDepth(this.currentDepth + 1);
    this.events.emit('depthChanged', this.currentDepth);
    this.events.emit('message', `Поверх ${this.currentDepth}.`);
  }

  private perform(action: Action): ActionResult {
    let result = action.perform(this);
    while (result.type === 'alternate') result = result.action.perform(this);
    return result;
  }

  private enterDepth(depth: number): void {
    const level = buildLevel(this.generator, deriveSeed(this.seed, depth));
    this.currentStage = new Stage(level.tiles);
    this.currentDepth = depth;
    this.currentActor = 0;

    this.hero.pos = level.start;
    this.currentStage.addActor(this.hero);
  }
}
