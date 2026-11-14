import { describe, expect, it } from 'vitest';
import { config } from '../src/config';
import { chapters } from '../src/ui/story';

describe('story', () => {
  it('has a chapter for every floor', () => {
    expect(chapters).toHaveLength(config.maxDepth);
    for (const chapter of chapters) expect(chapter.lines.length).toBeGreaterThan(0);
  });
});
