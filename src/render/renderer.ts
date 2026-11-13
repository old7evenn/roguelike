import type { GameState } from '../game/state';

/**
 * Контракт рендерера. Гра знає лише про цей інтерфейс,
 * тому Canvas 2D можна замінити на PixiJS чи three.js, не чіпаючи логіку.
 */
export interface Renderer {
  draw(state: GameState): void;
}
