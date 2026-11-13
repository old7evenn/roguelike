import { config } from '../config';
import { EventBus } from '../engine/event-bus';
import { deriveSeed, Rng } from '../engine/rng';
import { Vec } from '../engine/vec';
import type { DungeonGenerator } from '../generation/dungeon-generator';
import { buildLevel } from '../generation/level';
import { RoomsAndCorridors } from '../generation/rooms-and-corridors';
import { spawnMonsters } from '../generation/spawn-monsters';
import type { Action, ActionResult } from './actions/action';
import { Hero } from './hero';
import { Stage } from './stage';

export interface GameEvents {
  message: string;
  depthChanged: number;
  victory: { turns: number };
}

export type GameStatus = 'playing' | 'won';

/**
 * Salts for `deriveSeed`. Depths use 1…maxDepth for their maps, so play uses 0.
 * Spawns get their own stream per depth: tweaking the monsters never reshapes the map.
 */
const PLAY_SALT = 0;
const SPAWN_SALT = 1;

export class Game {
  readonly seed: number;
  readonly hero = new Hero(new Vec(0, 0));
  readonly events = new EventBus<GameEvents>();
  /** Randomness during play (e.g. wandering monsters); depends on the player's moves. */
  readonly rng: Rng;

  private readonly generator: DungeonGenerator;
  private currentStage!: Stage;
  private currentDepth = 0;
  private currentActor = 0;
  private turnCount = 0;
  private gameStatus: GameStatus = 'playing';

  constructor(seed: number, generator: DungeonGenerator = new RoomsAndCorridors()) {
    this.seed = seed;
    this.rng = new Rng(deriveSeed(seed, PLAY_SALT));
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
    const levelSeed = deriveSeed(this.seed, depth);
    const level = buildLevel(this.generator, levelSeed);
    this.currentStage = new Stage(level.tiles);
    this.currentDepth = depth;
    this.currentActor = 0;

    // The hero goes first so the turn order starts with the player.
    this.hero.pos = level.start;
    this.currentStage.addActor(this.hero);
    for (const monster of spawnMonsters(level, depth, new Rng(deriveSeed(levelSeed, SPAWN_SALT)))) {
      this.currentStage.addActor(monster);
    }
  }
}
