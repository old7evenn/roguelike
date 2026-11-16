import { Vec } from '../engine/vec';
import type { Display, Glyph, Sprite, TextStyle } from './display';
import { theme } from './theme';

const FONT_FAMILY = 'ui-monospace, Menlo, Consolas, monospace';

export class CanvasDisplay implements Display {
  readonly columns: number;
  readonly rows: number;
  private readonly cellSize: number;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, columns: number, rows: number, cellSize: number) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is not supported');

    this.canvas = canvas;
    this.context = context;
    this.columns = columns;
    this.rows = rows;
    this.cellSize = cellSize;
    // CSS sizes the canvas to fit the window while keeping this ratio.
    canvas.style.setProperty('--aspect', String(columns / rows));
    this.resize();
  }

  /** Must be re-run when devicePixelRatio changes, otherwise text blurs on HiDPI screens. */
  resize(): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = this.columns * this.cellSize * ratio;
    this.canvas.height = this.rows * this.cellSize * ratio;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.context.textBaseline = 'middle';
    this.context.lineJoin = 'round';
    this.context.lineCap = 'round';
  }

  /** The cell under a mouse or touch point, or null outside the canvas. */
  cellAt(clientX: number, clientY: number): Vec | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * this.columns);
    const y = Math.floor(((clientY - rect.top) / rect.height) * this.rows);
    if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) return null;
    return new Vec(x, y);
  }

  clear(): void {
    this.context.fillStyle = theme.background;
    this.context.fillRect(0, 0, this.columns * this.cellSize, this.rows * this.cellSize);
  }

  drawGlyph(pos: Vec, glyph: Glyph): void {
    const { context, cellSize } = this;
    const left = pos.x * cellSize;
    const top = pos.y * cellSize;

    if (glyph.bg) {
      context.fillStyle = glyph.bg;
      context.fillRect(left, top, cellSize, cellSize);
    }
    context.font = this.font(1);
    context.textAlign = 'center';
    context.fillStyle = glyph.fg;
    context.fillText(glyph.char, left + cellSize / 2, top + cellSize / 2 + 1);
  }

  drawSprite(pos: Vec, sprite: Sprite): void {
    const { context, cellSize } = this;
    const x = (pos.x + 0.5) * cellSize;
    const y = (pos.y + 0.5) * cellSize;
    const r = (sprite.size * cellSize) / 2;

    context.save();
    context.fillStyle = sprite.color;
    context.strokeStyle = theme.background;
    context.lineWidth = Math.max(1, cellSize / 12);
    switch (sprite.shape) {
      case 'hero':
        this.drawHero(x, y, r, sprite.color);
        break;
      case 'ghost':
        this.drawGhost(x, y, r, false);
        break;
      case 'horned':
        this.drawGhost(x, y, r, true);
        break;
      case 'mug':
        this.drawMug(x, y, r);
        break;
      case 'stick':
        this.drawStick(x, y, r, sprite.color);
        break;
    }
    context.restore();
  }

  drawText(x: number, y: number, text: string, style: TextStyle): void {
    const { context, cellSize } = this;
    context.font = this.font(style.scale ?? 1);
    context.textAlign = style.align ?? 'left';
    context.fillStyle = style.color;
    context.fillText(text, x * cellSize, (y + 0.5) * cellSize);
  }

  fillRect(x: number, y: number, width: number, height: number, color: string): void {
    const { context, cellSize } = this;
    context.fillStyle = color;
    context.fillRect(x * cellSize, y * cellSize, width * cellSize, height * cellSize);
  }

  strokeRect(x: number, y: number, width: number, height: number, color: string): void {
    const { context, cellSize } = this;
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.strokeRect(x * cellSize + 1, y * cellSize + 1, width * cellSize - 2, height * cellSize - 2);
  }

  /** A glowing disc with the classic '@' cut into it, so the hero is never lost on the map. */
  private drawHero(x: number, y: number, r: number, color: string): void {
    const { context } = this;
    context.shadowColor = color;
    context.shadowBlur = r * 1.5;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.font = `bold ${Math.round(r * 1.6)}px ${FONT_FAMILY}`;
    context.textAlign = 'center';
    context.fillStyle = theme.background;
    context.fillText('@', x, y + 1);
  }

  /** A sheet ghost: dome head, wavy hem, two eyes. Horns and red pupils mark the boss. */
  private drawGhost(x: number, y: number, r: number, horned: boolean): void {
    const { context } = this;
    const headY = y - r * 0.15;
    const hemY = y + r * 0.85;

    if (horned) {
      context.beginPath();
      for (const side of [-1, 1]) {
        context.moveTo(x + side * r * 0.75, headY - r * 0.55);
        context.lineTo(x + side * r * 1.0, headY - r * 1.35);
        context.lineTo(x + side * r * 0.3, headY - r * 0.9);
      }
      context.fill();
      context.stroke();
    }

    context.beginPath();
    context.moveTo(x - r, hemY);
    context.lineTo(x - r, headY);
    context.arc(x, headY, r, Math.PI, 0);
    context.lineTo(x + r, hemY);
    const waves = 3;
    const waveWidth = (2 * r) / waves;
    for (let i = 0; i < waves; i++) {
      const right = x + r - i * waveWidth;
      context.quadraticCurveTo(right - waveWidth / 2, hemY - r * 0.45, right - waveWidth, hemY);
    }
    context.closePath();
    context.fill();
    context.stroke();

    for (const side of [-1, 1]) {
      const eyeX = x + side * r * 0.38;
      context.fillStyle = '#ffffff';
      context.beginPath();
      context.ellipse(eyeX, headY, r * 0.24, r * 0.3, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = horned ? '#d10036' : theme.background;
      context.beginPath();
      context.arc(eyeX, headY + r * 0.06, r * 0.13, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawMug(x: number, y: number, r: number): void {
    const { context } = this;
    const left = x - r * 0.75;
    const top = y - r * 0.35;
    const width = r * 1.15;
    const height = r * 1.1;

    context.beginPath();
    context.arc(left + width, top + height * 0.45, r * 0.32, -Math.PI / 2, Math.PI / 2);
    context.lineWidth = r * 0.2;
    context.strokeStyle = context.fillStyle;
    context.stroke();

    context.beginPath();
    context.roundRect(left, top, width, height, r * 0.2);
    context.fill();

    context.strokeStyle = theme.text;
    context.lineWidth = Math.max(1, r * 0.12);
    context.globalAlpha = 0.7;
    for (const dx of [0.3, 0.75]) {
      context.beginPath();
      context.moveTo(left + width * dx, top - r * 0.15);
      context.quadraticCurveTo(
        left + width * dx + r * 0.2,
        top - r * 0.45,
        left + width * dx,
        top - r * 0.75,
      );
      context.stroke();
    }
  }

  /** Something to hold: a short rod with a bright tip. */
  private drawStick(x: number, y: number, r: number, color: string): void {
    const { context } = this;
    context.lineWidth = r * 0.45;
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(x - r * 0.7, y + r * 0.7);
    context.lineTo(x + r * 0.55, y - r * 0.55);
    context.stroke();

    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(x + r * 0.6, y - r * 0.6, r * 0.25, 0, Math.PI * 2);
    context.fill();
  }

  private font(scale: number): string {
    return `bold ${Math.round(this.cellSize * 0.8 * scale)}px ${FONT_FAMILY}`;
  }
}
