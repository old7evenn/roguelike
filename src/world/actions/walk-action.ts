import type { Vec } from '../../engine/vec';
import type { Actor } from '../actor';
import type { Game } from '../game';
import { Action, ActionResult } from './action';
import { AttackAction } from './attack-action';
import { DescendAction } from './descend-action';
import { PickUpAction } from './pick-up-action';

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

    const occupant = game.stage.actorAt(target);
    if (occupant) {
      // Only the hero and monsters fight each other; monsters never hurt their own.
      const enemies = (this.actor === game.hero) !== (occupant === game.hero);
      return enemies
        ? ActionResult.alternate(new AttackAction(this.actor, occupant))
        : ActionResult.failure('Прохід зайнятий.');
    }
    if (tile.isExit && this.actor === game.hero) {
      return ActionResult.alternate(new DescendAction(this.actor));
    }

    this.actor.pos = target;
    // Picking up is part of the same step, so it doesn't cost the hero an extra turn.
    if (this.actor === game.hero && game.stage.itemAt(target)) {
      return ActionResult.alternate(new PickUpAction(game.hero));
    }
    return ActionResult.success;
  }
}
