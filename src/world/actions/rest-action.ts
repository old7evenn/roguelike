import { Action, ActionResult } from './action';

export class RestAction extends Action {
  override perform(): ActionResult {
    return ActionResult.success;
  }
}
