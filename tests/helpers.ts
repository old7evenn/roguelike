import { Array2D } from '../src/engine/array2d';
import { Vec } from '../src/engine/vec';
import type { DungeonGenerator, GeneratedMap } from '../src/generation/dungeon-generator';
import { RestAction } from '../src/world/actions/rest-action';
import type { Breed } from '../src/world/breeds';
import { Game } from '../src/world/game';
import { Monster } from '../src/world/monster';
import { Tiles, type TileType } from '../src/world/tile';

/** A single walled 20×5 room with the hero starting in the left corner: easy to reason about. */
export class OpenRoom implements DungeonGenerator {
  generate(): GeneratedMap {
    const tiles = new Array2D<TileType>(22, 7, Tiles.wall);
    for (let y = 1; y <= 5; y++) for (let x = 1; x <= 20; x++) tiles.set(new Vec(x, y), Tiles.floor);
    return { tiles, start: new Vec(1, 1) };
  }
}

export function clearMonsters(game: Game): void {
  for (const actor of [...game.stage.actors]) if (actor !== game.hero) game.stage.removeActor(actor);
}

/** A game in `OpenRoom` with no spawned monsters, plus `monster` placed at `pos`. */
export function gameWith(breed: Breed, pos: Vec, seed = 1): { game: Game; monster: Monster } {
  const game = new Game(seed, () => new OpenRoom());
  clearMonsters(game);
  const monster = new Monster(breed, pos);
  game.stage.addActor(monster);
  return { game, monster };
}

export function rest(game: Game, turns: number): void {
  for (let i = 0; i < turns; i++) {
    game.hero.setNextAction(new RestAction(game.hero));
    game.update();
  }
}
