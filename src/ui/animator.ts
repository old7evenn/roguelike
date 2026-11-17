import { Vec } from '../engine/vec';
import type { Actor } from '../world/actor';
import { withAlpha } from './color';
import type { Display, Sprite } from './display';

/** A step glides over this long: about the gap between steps when a key is held. */
const SLIDE_MS = 110;
const LUNGE_MS = 160;
/** How far an attacker leans toward its target, in cells. */
const LUNGE_REACH = 0.35;
const FLOAT_MS = 850;
const FADE_MS = 450;
const FLASH_MS = 300;
const FLASH_OPACITY = 0.22;

interface Slide {
  readonly from: Vec;
  readonly to: Vec;
  readonly start: number;
}

interface Lunge {
  readonly toward: Vec;
  readonly start: number;
}

interface FloatingText {
  readonly pos: Vec;
  readonly text: string;
  readonly color: string;
  readonly start: number;
}

interface Fading {
  readonly pos: Vec;
  readonly sprite: Sprite;
  readonly start: number;
}

/**
 * The world moves in whole cells and whole turns; this makes it look continuous.
 * Only drawing is animated: by the time an animation starts the turn is already
 * over, so nothing here can change how a turn plays out.
 * Times are `requestAnimationFrame` timestamps in ms.
 */
export class Animator {
  private readonly slides = new Map<Actor, Slide>();
  private readonly lunges = new Map<Actor, Lunge>();
  private texts: FloatingText[] = [];
  private fadings: Fading[] = [];
  private flashColor = '';
  private flashStart = Number.NEGATIVE_INFINITY;

  /** Starts a glide for every actor whose cell changed since the last call. */
  follow(actors: readonly Actor[], now: number): void {
    for (const actor of actors) {
      const slide = this.slides.get(actor);
      if (slide?.to.equals(actor.pos)) continue;
      const from = slide ? glide(slide, now) : actor.pos;
      // Farther than a couple of cells is a new floor, not a step: jump there.
      const isStep = Math.abs(from.x - actor.pos.x) + Math.abs(from.y - actor.pos.y) <= 2;
      this.slides.set(actor, { from: isStep ? from : actor.pos, to: actor.pos, start: now });
    }
    for (const actor of this.slides.keys()) {
      if (!actors.includes(actor)) this.slides.delete(actor);
    }
  }

  /** Where to draw `actor` now; fractional while it glides or lunges. */
  positionOf(actor: Actor, now: number): Vec {
    const slide = this.slides.get(actor);
    const pos = slide ? glide(slide, now) : actor.pos;
    const lunge = this.lunges.get(actor);
    if (!lunge) return pos;
    const t = (now - lunge.start) / LUNGE_MS;
    if (t >= 1) return pos;
    const reach = Math.sin(t * Math.PI) * LUNGE_REACH;
    return new Vec(pos.x + lunge.toward.x * reach, pos.y + lunge.toward.y * reach);
  }

  lunge(attacker: Actor, defender: Actor, now: number): void {
    const toward = new Vec(
      Math.sign(defender.pos.x - attacker.pos.x),
      Math.sign(defender.pos.y - attacker.pos.y),
    );
    this.lunges.set(attacker, { toward, start: now });
  }

  /** Text that rises from a cell and fades: damage numbers, picked-up items. */
  floatText(pos: Vec, text: string, color: string, now: number): void {
    this.texts.push({ pos, text, color, start: now });
  }

  /** A dead actor is already off the stage; its ghost drifts up and fades where it stood. */
  fadeOut(actor: Actor, sprite: Sprite, now: number): void {
    this.fadings.push({ pos: this.positionOf(actor, now), sprite, start: now });
  }

  /** Tints the whole map for a moment: the hero got hurt. */
  flash(color: string, now: number): void {
    this.flashColor = color;
    this.flashStart = now;
  }

  /** Drops finished effects. True while anything is still moving, so the screen keeps redrawing. */
  update(now: number): boolean {
    this.texts = this.texts.filter((text) => now - text.start < FLOAT_MS);
    this.fadings = this.fadings.filter((fading) => now - fading.start < FADE_MS);
    for (const [actor, lunge] of this.lunges) {
      if (now - lunge.start >= LUNGE_MS) this.lunges.delete(actor);
    }
    const isGliding = [...this.slides.values()].some(
      (slide) => now - slide.start < SLIDE_MS && !slide.from.equals(slide.to),
    );
    return (
      isGliding ||
      this.lunges.size > 0 ||
      this.texts.length > 0 ||
      this.fadings.length > 0 ||
      now - this.flashStart < FLASH_MS
    );
  }

  /** Effects on top of the map; `width` and `height` are the map's size in cells. */
  drawEffects(display: Display, now: number, width: number, height: number): void {
    for (const { pos, sprite, start } of this.fadings) {
      const t = (now - start) / FADE_MS;
      display.drawSprite(new Vec(pos.x, pos.y - 0.4 * t), sprite, 0.8 * (1 - t));
    }

    const flash = (now - this.flashStart) / FLASH_MS;
    if (flash < 1)
      display.fillRect(0, 0, width, height, withAlpha(this.flashColor, FLASH_OPACITY * (1 - flash)));

    for (const { pos, text, color, start } of this.texts) {
      const t = (now - start) / FLOAT_MS;
      display.drawText(pos.x + 0.5, pos.y - 0.3 - 0.9 * t, text, {
        color,
        align: 'center',
        scale: 1.2,
        alpha: 1 - t * t,
      });
    }
  }
}

/** Eases out: quick off the mark, settling into the cell. */
function glide({ from, to, start }: Slide, now: number): Vec {
  const t = Math.min(1, (now - start) / SLIDE_MS);
  const eased = 1 - (1 - t) * (1 - t);
  return new Vec(from.x + (to.x - from.x) * eased, from.y + (to.y - from.y) * eased);
}
