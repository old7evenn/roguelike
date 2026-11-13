import type { Action } from './actions/action';
import { Actor } from './actor';

/** Controlled by the UI: input queues an action, the game loop consumes it. */
export class Hero extends Actor {
  private queuedAction: Action | null = null;

  setNextAction(action: Action): void {
    this.queuedAction = action;
  }

  override nextAction(): Action | null {
    const action = this.queuedAction;
    this.queuedAction = null;
    return action;
  }
}
