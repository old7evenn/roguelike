import { Array2D } from './array2d';
import { Vec } from './vec';

/**
 * Maps a cell from octant-local coordinates (`row` steps away from the origin,
 * `col` steps sideways) onto the grid. Together the eight transforms cover the
 * full circle, so the scan below is written once, for a single octant.
 */
const OCTANTS = [
  { xx: 1, xy: 0, yx: 0, yy: 1 },
  { xx: 0, xy: 1, yx: 1, yy: 0 },
  { xx: 0, xy: -1, yx: 1, yy: 0 },
  { xx: -1, xy: 0, yx: 0, yy: 1 },
  { xx: -1, xy: 0, yx: 0, yy: -1 },
  { xx: 0, xy: -1, yx: -1, yy: 0 },
  { xx: 0, xy: 1, yx: -1, yy: 0 },
  { xx: 1, xy: 0, yx: 0, yy: -1 },
] as const;

type Octant = (typeof OCTANTS)[number];

/**
 * Recursive shadowcasting (Björn Bergström, RogueBasin): which cells are visible
 * from `origin` within `radius`. Each octant is scanned row by row moving away
 * from the origin; the visible part of a row is the slope interval
 * [`end`, `start`]. An opaque cell splits it: the part left of the blocker is
 * scanned further by a recursive call, the part right of it continues here.
 * Opaque cells themselves are visible, so walls get lit.
 */
export function fieldOfView(
  width: number,
  height: number,
  origin: Vec,
  radius: number,
  blocksSight: (pos: Vec) => boolean,
): Array2D<boolean> {
  const visible = new Array2D(width, height, false);
  if (!visible.contains(origin)) return visible;
  visible.set(origin, true);

  const castLight = (octant: Octant, firstRow: number, startSlope: number, endSlope: number): void => {
    let start = startSlope;
    if (start < endSlope) return;

    for (let row = firstRow; row <= radius; row++) {
      let blocked = false;
      let nextStart = start;

      for (let col = -row; col <= 0; col++) {
        // Slopes of the cell's two corners, as seen from the origin.
        const leftSlope = (col - 0.5) / (-row + 0.5);
        const rightSlope = (col + 0.5) / (-row - 0.5);
        if (start < rightSlope) continue;
        if (endSlope > leftSlope) break;

        const pos = new Vec(
          origin.x + col * octant.xx + -row * octant.xy,
          origin.y + col * octant.yx + -row * octant.yy,
        );
        if (col * col + row * row <= radius * radius && visible.contains(pos)) visible.set(pos, true);

        const opaque = blocksSight(pos);
        if (blocked) {
          if (opaque) {
            nextStart = rightSlope;
          } else {
            blocked = false;
            start = nextStart;
          }
        } else if (opaque && row < radius) {
          blocked = true;
          castLight(octant, row + 1, start, leftSlope);
          nextStart = rightSlope;
        }
      }
      // The row ended in shadow: everything farther in this octant is hidden.
      if (blocked) break;
    }
  };

  for (const octant of OCTANTS) castLight(octant, 1, 1, 0);
  return visible;
}
