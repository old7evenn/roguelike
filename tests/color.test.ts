import { describe, expect, it } from 'vitest';
import { mixColors } from '../src/ui/color';

describe('mixColors', () => {
  it('returns the ends at 0 and 1 and blends each channel in between', () => {
    expect(mixColors('#000000', '#ff8040', 0)).toBe('#000000');
    expect(mixColors('#000000', '#ff8040', 1)).toBe('#ff8040');
    expect(mixColors('#000000', '#ff8040', 0.5)).toBe('#804020');
  });
});
