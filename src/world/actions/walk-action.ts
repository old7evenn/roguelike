import type { Vec } from '../../engine/vec';
import type { Actor } from '../actor';
import type { Game } from '../game';
import { Action, ActionResult } from './action';
import { DescendAction } from './descend-action';

export class WalkAction extends Action {
  private readonly direction: Vec;

  constructor(actor: Actor, direction: Vec) {
    super(actor);
    this.direction = direction;
  }

  override perform(game: Game): ActionResult {
    const target = this.actor.pos.add(this.direction);
    const tile = game.stage.tileAt(target);

    if (!tile.isWalkable) return ActionResult.failure('Тут стіна.');
    if (game.stage.actorAt(target)) return ActionResult.failure('Прохід зайнятий.');
    if (tile.isExit && this.actor === game.hero) {
      return ActionResult.alternate(new DescendAction(this.actor));
    }

    this.actor.pos = target;
    return ActionResult.success;
  }
}
