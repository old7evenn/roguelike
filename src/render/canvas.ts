import { Grid, Tile } from '../core/grid';
import { MAX_FLOOR, type GameState } from '../game/state';
import type { Renderer } from './renderer';
import { THEME } from './theme';

/**
 * Рендерер на Canvas 2D у стилі ASCII: кожна клітинка — кольоровий квадрат із символом.
 * Гра покрокова, тому малюємо кадр лише тоді, коли стан змінився (див. main.ts).
 */
export class CanvasRenderer implements Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private readonly cols: number;
  private readonly rows: number;
  private readonly tile: number;

  constructor(canvas: HTMLCanvasElement, cols: number, rows: number, tile = 20) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not supported');
    this.canvas = canvas;
    this.ctx = ctx;
    this.cols = cols;
    this.rows = rows;
    this.tile = tile;
    this.resize();
  }

  /** Враховуємо devicePixelRatio, інакше на Retina-екранах текст буде розмитий. */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.cols * this.tile * dpr;
    this.canvas.height = this.rows * this.tile * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  draw(state: GameState): void {
    const { ctx } = this;
    ctx.fillStyle = THEME.background;
    ctx.fillRect(0, 0, this.cols * this.tile, this.rows * this.tile);

    if (state.screen === 'title') return this.drawTitle(state);
    if (state.screen === 'won') return this.drawWon(state);

    this.drawMap(state.floor.grid);
    this.glyph(state.player.x, state.player.y, THEME.player.glyph, THEME.player.fg);
  }

  private drawMap(grid: Grid): void {
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const t = grid.get(x, y);
        if (t === Tile.Wall) {
          // Малюємо тільки стіни, що межують з підлогою, — решта лишається «темрявою».
          if (touchesFloor(grid, x, y)) this.cell(x, y, THEME.wall);
        } else if (t === Tile.Stairs) {
          this.cell(x, y, THEME.stairs);
        } else {
          this.cell(x, y, THEME.floor);
        }
      }
    }
  }

  private cell(x: number, y: number, style: { glyph: string; fg: string; bg: string }): void {
    this.ctx.fillStyle = style.bg;
    this.ctx.fillRect(x * this.tile, y * this.tile, this.tile, this.tile);
    this.glyph(x, y, style.glyph, style.fg);
  }

  private glyph(x: number, y: number, ch: string, color: string): void {
    const { ctx, tile } = this;
    ctx.font = `bold ${Math.floor(tile * 0.8)}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillStyle = color;
    ctx.fillText(ch, x * tile + tile / 2, y * tile + tile / 2 + 1);
  }

  private text(str: string, row: number, size: number, color: string): void {
    const { ctx } = this;
    ctx.font = `bold ${size}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillStyle = color;
    ctx.fillText(str, (this.cols * this.tile) / 2, row * this.tile);
  }

  private drawTitle(state: GameState): void {
    const mid = Math.floor(this.rows / 2);
    this.text(THEME.title, mid - 5, 56, THEME.accent);
    this.text(THEME.subtitle, mid - 2, 20, THEME.text);
    this.text(`seed: ${state.runSeed}`, mid + 1, 18, THEME.dim);
    this.text('Enter — почати   ·   N — новий seed', mid + 4, 18, THEME.text);
  }

  private drawWon(state: GameState): void {
    const mid = Math.floor(this.rows / 2);
    this.text('ПЕРЕМОГА', mid - 4, 56, THEME.accent);
    this.text(`Ти пройшов ${MAX_FLOOR} поверхів за ${state.turn} ходів`, mid, 20, THEME.text);
    this.text(`seed: ${state.runSeed}`, mid + 2, 18, THEME.dim);
    this.text('Enter — нова гра', mid + 5, 18, THEME.text);
  }
}

function touchesFloor(grid: Grid, x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dy) && grid.isWalkable(x + dx, y + dy)) return true;
    }
  }
  return false;
}
