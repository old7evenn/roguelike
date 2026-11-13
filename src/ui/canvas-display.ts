import type { Vec } from '../engine/vec';
import type { Display, Glyph, TextStyle } from './display';
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
    this.resize();
  }

  /** Must be re-run when devicePixelRatio changes, otherwise text blurs on HiDPI screens. */
  resize(): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = this.columns * this.cellSize * ratio;
    this.canvas.height = this.rows * this.cellSize * ratio;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.context.textBaseline = 'middle';
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

  drawText(x: number, y: number, text: string, style: TextStyle): void {
    const { context, cellSize } = this;
    context.font = this.font(style.scale ?? 1);
    context.textAlign = style.align ?? 'left';
    context.fillStyle = style.color;
    context.fillText(text, x * cellSize, (y + 0.5) * cellSize);
  }

  private font(scale: number): string {
    return `bold ${Math.round(this.cellSize * 0.8 * scale)}px ${FONT_FAMILY}`;
  }
}
