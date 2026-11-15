import { describe, expect, it } from 'vitest';
import { MessageLog } from '../src/ui/message-log';

describe('MessageLog', () => {
  it('keeps only the newest lines, oldest first', () => {
    const log = new MessageLog(2);
    log.add('a');
    log.add('b');
    log.add('c');
    expect(log.lines.map((line) => line.text)).toEqual(['b', 'c']);
  });

  it('counts a repeated line instead of adding it again', () => {
    const log = new MessageLog(3);
    log.add('Тут стіна.');
    log.add('Тут стіна.');
    log.add('Тут стіна.');
    expect(log.lines).toEqual([{ text: 'Тут стіна.', count: 3, isNew: true }]);
  });

  it('marks lines as old until they are repeated', () => {
    const log = new MessageLog(3);
    log.add('a');
    log.add('b');
    log.markAllOld();
    log.add('b');
    expect(log.lines.map((line) => line.isNew)).toEqual([false, true]);
  });
});
