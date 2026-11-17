import { describe, expect, it } from 'vitest';
import { mixColors, withAlpha } from '../src/ui/color';

describe('mixColors', () => {
  it('returns the ends at 0 and 1 and blends each channel in between', () => {
    expect(mixColors('#000000', '#ff8040', 0)).toBe('#000000');
    expect(mixColors('#000000', '#ff8040', 1)).toBe('#ff8040');
    expect(mixColors('#000000', '#ff8040', 0.5)).toBe('#804020');
  });
});

describe('withAlpha', () => {
  it('keeps the channels and adds the opacity', () => {
    expect(withAlpha('#ff8040', 0.25)).toBe('rgba(255, 128, 64, 0.25)');
  });
});
