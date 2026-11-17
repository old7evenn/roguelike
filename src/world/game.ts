import { config } from '../config';
import { EventBus } from '../engine/event-bus';
import { deriveSeed, Rng } from '../engine/rng';
import { Vec } from '../engine/vec';
import type { DungeonGenerator } from '../generation/dungeon-generator';
import { generatorForDepth } from '../generation/generator-for-depth';
import { buildLevel } from '../generation/level';
import { spawnItems } from '../generation/spawn-items';
import { spawnMonsters } from '../generation/spawn-monsters';
import type { Action, ActionResult } from './actions/action';
import type { Actor } from './actor';
import { Boss, type BreedId } from './breeds';
import { Hero } from './hero';
import type { ItemType } from './items';
import { Monster } from './monster';
import { Stage } from './stage';

export interface GameEvents {
  message: string;
  depthChanged: number;
  victory: { turns: number };
  attack: { attacker: Actor; defender: Actor; damage: number };
  /** A monster died; the hero dying is `defeat` instead. */
  death: { actor: Actor; killer: Actor };
  defeat: { killer: Actor };
  itemPickedUp: ItemType;
  itemUsed: ItemType;
  summon: { summoner: Actor; summoned: Actor };
}

export type GameStatus = 'playing' | 'won' | 'lost';

/**
 * Salts for `deriveSeed`. Depths use 1…maxDepth for their maps, so play uses 0.
 * Spawns get their own streams per depth: tweaking monsters or items never reshapes
 * the map, and tweaking items never moves the monsters.
 */
const PLAY_SALT = 0;
const SPAWN_SALT = 1;
const ITEM_SALT = 2;

export class Game {
  readonly seed: number;
  readonly hero = new Hero(new Vec(0, 0));
  readonly events = new EventBus<GameEvents>();
  /** Randomness during play (e.g. wandering monsters); depends on the player's moves. */
  readonly rng: Rng;

  private readonly generatorFor: (depth: number) => DungeonGenerator;
  private currentStage!: Stage;
  private finalBoss: Monster | null = null;
  private currentDepth = 0;
  private currentActor = 0;
  private turnCount = 0;
  private gameStatus: GameStatus = 'playing';
  private readonly defeatedByBreed = new Map<BreedId, number>();

  /** `generatorFor` picks the map strategy for each depth; tests pass a fixed one. */
  constructor(seed: number, generatorFor: (depth: number) => DungeonGenerator = generatorForDepth) {
    this.seed = seed;
    this.rng = new Rng(deriveSeed(seed, PLAY_SALT));
    this.generatorFor = generatorFor;
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

  get defeatedMonsters(): ReadonlyMap<BreedId, number> {
    return this.defeatedByBreed;
  }

  /** Set once the hero reaches the last floor. */
  get boss(): Monster | null {
    return this.finalBoss;
  }

  /**
   * Runs actors in order until one has nothing to do — normally the hero
   * waiting for input. Call again after queueing the hero's next action.
   */
  update(): void {
    while (this.gameStatus === 'playing') {
      const actor = this.currentStage.actors[this.currentActor];
      if (!actor) return;
      // Monsters have moved since the hero last looked, so the view is refreshed before every hero turn.
      if (actor === this.hero) this.refreshView();

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

  /** Only reachable by stairs, and the last floor has none. */
  descend(): void {
    this.hero.growStronger();
    this.enterDepth(this.currentDepth + 1);
    this.events.emit('depthChanged', this.currentDepth);
  }

  kill(actor: Actor, killer: Actor): void {
    if (actor === this.hero) {
      this.gameStatus = 'lost';
      this.events.emit('defeat', { killer });
      return;
    }
    // Removing an actor before the current one shifts the rest left; step back
    // with them so the next actor in line doesn't lose its turn.
    if (this.currentStage.actors.indexOf(actor) < this.currentActor) this.currentActor--;
    this.currentStage.removeActor(actor);
    if (actor instanceof Monster && killer === this.hero) {
      const id = actor.breed.id;
      this.defeatedByBreed.set(id, (this.defeatedByBreed.get(id) ?? 0) + 1);
    }
    this.events.emit('death', { actor, killer });

    if (actor === this.finalBoss) {
      this.gameStatus = 'won';
      this.events.emit('victory', { turns: this.turnCount });
    }
  }

  private refreshView(): void {
    this.currentStage.refreshView(this.hero.pos, this.hero.sightRadius);
  }

  private perform(action: Action): ActionResult {
    let result = action.perform(this);
    while (result.type === 'alternate') result = result.action.perform(this);
    return result;
  }

  private enterDepth(depth: number): void {
    const levelSeed = deriveSeed(this.seed, depth);
    const isLastFloor = depth === config.maxDepth;
    const level = buildLevel(this.generatorFor(depth), levelSeed, !isLastFloor);
    this.currentStage = new Stage(level.tiles);
    this.currentDepth = depth;
    this.currentActor = 0;

    // The hero goes first so the turn order starts with the player.
    this.hero.pos = level.start;
    this.currentStage.addActor(this.hero);
    if (isLastFloor) {
      this.finalBoss = new Monster(Boss, level.exit);
      this.currentStage.addActor(this.finalBoss);
    }
    for (const monster of spawnMonsters(level, depth, new Rng(deriveSeed(levelSeed, SPAWN_SALT)))) {
      this.currentStage.addActor(monster);
    }
    for (const item of spawnItems(level, depth, new Rng(deriveSeed(levelSeed, ITEM_SALT)))) {
      this.currentStage.addItem(item);
    }
    this.refreshView();
  }
}
