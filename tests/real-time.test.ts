import { describe, expect, it } from 'vitest';
import { Vec } from '../src/engine/vec';
import type { Display } from '../src/ui/display';
import { PlayScreen } from '../src/ui/screens/play-screen';
import { Ui } from '../src/ui/ui';
import { WanderBehavior } from '../src/world/behaviors/wander-behavior';
import { Breeds } from '../src/world/breeds';
import { gameWith } from './helpers';

const display: Display = {
  columns: 86,
  rows: 41,
  clear: () => undefined,
  drawGlyph: () => undefined,
  drawSprite: () => undefined,
  drawText: () => undefined,
  fillRect: () => undefined,
  strokeRect: () => undefined,
};

describe('real-time turns', () => {
  it('lets monsters patrol while the player gives no input', () => {
    const breed = { ...Breeds.restlessness, behavior: new WanderBehavior(0) };
    const { game, monster } = gameWith(breed, new Vec(5, 3));
    const screen = new PlayScreen(new Ui(display), game);
    const start = monster.pos;

    for (const now of [0, 100, 200, 300, 400, 500]) screen.update(now);

    expect(game.turns).toBe(1);
    expect(monster.pos).not.toEqual(start);
  });
});
