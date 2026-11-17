import { describe, expect, it } from 'vitest';
import { inputForKey, isInput } from '../src/ui/input';

describe('input', () => {
  it('maps both help keys to the same input', () => {
    expect(inputForKey('KeyH')).toBe('help');
    expect(inputForKey('Slash')).toBe('help');
    expect(isInput('help')).toBe(true);
  });
});
