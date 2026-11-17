/** Linear blend of two `#rrggbb` colors: `t = 0` gives `from`, `t = 1` gives `to`. */
export function mixColors(from: string, to: string, t: number): string {
  let result = '#';
  for (let i = 1; i < 7; i += 2) {
    const a = Number.parseInt(from.slice(i, i + 2), 16);
    const b = Number.parseInt(to.slice(i, i + 2), 16);
    result += Math.round(a + (b - a) * t)
      .toString(16)
      .padStart(2, '0');
  }
  return result;
}

/** A `#rrggbb` color as `rgba(...)` with the given opacity, for overlays drawn on top of the map. */
export function withAlpha(color: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
