import { describe, expect, it } from 'vitest';
import { Array2D } from '../src/engine/array2d';
import { fieldOfView } from '../src/engine/field-of-view';
import { Vec } from '../src/engine/vec';
import { Game } from '../src/world/game';
import { clearMonsters, OpenRoom, rest } from './helpers';

/** A 21×21 open field, optionally with wall cells. */
function view(origin: Vec, radius: number, walls: Vec[] = []): Array2D<boolean> {
  const opaque = new Array2D(21, 21, false);
  for (const wall of walls) opaque.set(wall, true);
  return fieldOfView(21, 21, origin, radius, (pos) => !opaque.contains(pos) || opaque.get(pos));
}

describe('fieldOfView', () => {
  const center = new Vec(10, 10);

  it('sees everything within the radius on open ground, and nothing beyond', () => {
    const visible = view(center, 5);
    for (const [pos, isVisible] of visible.entries()) {
      const dx = pos.x - center.x;
      const dy = pos.y - center.y;
      expect(isVisible, `${pos}`).toBe(dx * dx + dy * dy <= 25);
    }
  });

  it('lights a wall but hides what is behind it', () => {
    const visible = view(center, 8, [new Vec(12, 10)]);
    expect(visible.get(new Vec(12, 10))).toBe(true);
    expect(visible.get(new Vec(13, 10))).toBe(false);
    expect(visible.get(new Vec(16, 10))).toBe(false);
    // Cells off to the side of the shadow stay visible.
    expect(visible.get(new Vec(13, 13))).toBe(true);
  });

  it('sees nothing through a solid wall line', () => {
    const wallLine = Array.from({ length: 21 }, (_, y) => new Vec(13, y));
    const visible = view(center, 10, wallLine);
    for (const [pos, isVisible] of visible.entries()) {
      if (pos.x > 13) expect(isVisible, `${pos}`).toBe(false);
    }
  });

  it('copes with an origin at the edge of the map', () => {
    const visible = view(new Vec(0, 0), 3);
    expect(visible.get(new Vec(0, 0))).toBe(true);
    expect(visible.get(new Vec(2, 2))).toBe(true);
  });
});

describe('fog of war in a game', () => {
  it('remembers explored cells after the hero walks out of sight', () => {
    const game = new Game(1, () => new OpenRoom());
    clearMonsters(game);
    const farCorner = new Vec(20, 5);
    expect(game.stage.isVisible(game.hero.pos)).toBe(true);
    expect(game.stage.isExplored(farCorner)).toBe(false);

    game.hero.pos = new Vec(18, 4);
    rest(game, 1);
    expect(game.stage.isVisible(farCorner)).toBe(true);

    game.hero.pos = new Vec(1, 1);
    rest(game, 1);
    expect(game.stage.isVisible(farCorner)).toBe(false);
    expect(game.stage.isExplored(farCorner)).toBe(true);
  });
});
