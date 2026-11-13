import type { Game } from '../game';
import { Action, ActionResult } from './action';

export class DescendAction extends Action {
  override perform(game: Game): ActionResult {
    game.descend();
    return ActionResult.success;
  }
}
