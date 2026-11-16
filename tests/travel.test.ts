import { describe, expect, it } from 'vitest';
import { Array2D } from '../src/engine/array2d';
import { Vec } from '../src/engine/vec';
import { Breeds } from '../src/world/breeds';
import { ItemTypes } from '../src/world/items';
import { Monster } from '../src/world/monster';
import { Stage } from '../src/world/stage';
import { Tiles, type TileType } from '../src/world/tile';
import { exploreTarget, knownExit, stepToward, visibleMonsters } from '../src/world/travel';

/** Builds a stage from rows of '#' (wall), '.' (floor) and '>' (stairs). */
function stageFrom(rows: string[]): Stage {
  const tiles = new Array2D<TileType>(rows[0]?.length ?? 0, rows.length, Tiles.wall);
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === '.') tiles.set(new Vec(x, y), Tiles.floor);
      if (char === '>') tiles.set(new Vec(x, y), Tiles.stairsDown);
    });
  });
  return new Stage(tiles);
}

/** Follows `stepToward` until it stops, returning every cell visited. */
function walk(stage: Stage, from: Vec, goal: Vec): Vec[] {
  const path = [from];
  let pos = from;
  for (let step = stepToward(stage, pos, goal); step; step = stepToward(stage, pos, goal)) {
    pos = pos.add(step);
    path.push(pos);
  }
  return path;
}

describe('stepToward', () => {
  it('walks a shortest path to the goal', () => {
    const stage = stageFrom(['#######', '#.....#', '#######']);
    stage.refreshView(new Vec(1, 1), 8);

    const path = walk(stage, new Vec(1, 1), new Vec(5, 1));

    expect(path).toHaveLength(5);
    expect(path.at(-1)).toEqual(new Vec(5, 1));
  });

  it('never steps on the stairs on the way to somewhere else', () => {
    const stage = stageFrom(['#######', '#..>..#', '#.....#', '#######']);
    stage.refreshView(new Vec(1, 1), 8);

    const path = walk(stage, new Vec(1, 1), new Vec(5, 1));

    expect(path.at(-1)).toEqual(new Vec(5, 1));
    expect(path.some((pos) => stage.tileAt(pos).isExit)).toBe(false);
  });

  it('goes onto the stairs when they are the goal', () => {
    const stage = stageFrom(['#######', '#..>..#', '#######']);
    stage.refreshView(new Vec(1, 1), 8);

    expect(walk(stage, new Vec(1, 1), new Vec(3, 1)).at(-1)).toEqual(new Vec(3, 1));
  });

  it('refuses goals the hero has not seen or cannot stand on', () => {
    const stage = stageFrom(['############', '#..........#', '############']);
    stage.refreshView(new Vec(1, 1), 3);

    expect(stepToward(stage, new Vec(1, 1), new Vec(10, 1))).toBeNull();
    expect(stepToward(stage, new Vec(1, 1), new Vec(1, 0))).toBeNull();
  });
});

describe('exploreTarget', () => {
  it('heads for the edge of the explored area', () => {
    const stage = stageFrom(['############', '#..........#', '############']);
    stage.refreshView(new Vec(1, 1), 3);

    expect(exploreTarget(stage, new Vec(1, 1))).toEqual(new Vec(4, 1));
  });

  it('picks up items in sight before exploring further', () => {
    const stage = stageFrom(['############', '#..........#', '#..........#', '############']);
    stage.addItem({ type: ItemTypes.tea, pos: new Vec(1, 2) });
    stage.refreshView(new Vec(1, 1), 3);

    expect(exploreTarget(stage, new Vec(1, 1))).toEqual(new Vec(1, 2));
  });

  it('returns null once the whole floor is explored', () => {
    const stage = stageFrom(['#######', '#.....#', '#######']);
    stage.refreshView(new Vec(1, 1), 8);

    expect(exploreTarget(stage, new Vec(1, 1))).toBeNull();
  });
});

describe('knownExit', () => {
  it('knows the stairs only after seeing them', () => {
    const stage = stageFrom(['############', '#.........>#', '############']);

    stage.refreshView(new Vec(1, 1), 3);
    expect(knownExit(stage)).toBeNull();

    stage.refreshView(new Vec(8, 1), 3);
    expect(knownExit(stage)).toEqual(new Vec(10, 1));
  });
});

describe('visibleMonsters', () => {
  it('lists only monsters in sight, nearest first', () => {
    const stage = stageFrom(['##############', '#............#', '##############']);
    const far = new Monster(Breeds.whisper, new Vec(6, 1));
    const near = new Monster(Breeds.reproach, new Vec(3, 1));
    const hidden = new Monster(Breeds.memory, new Vec(12, 1));
    for (const monster of [far, near, hidden]) stage.addActor(monster);
    stage.refreshView(new Vec(1, 1), 6);

    expect(visibleMonsters(stage, new Vec(1, 1))).toEqual([near, far]);
  });
});
