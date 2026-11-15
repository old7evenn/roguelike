export interface LogEntry {
  readonly text: string;
  /** How many times in a row this exact text was added. */
  readonly count: number;
  /** Added since the last `markAllOld()`, i.e. caused by the player's latest input. */
  readonly isNew: boolean;
}

/** The last few things that happened, oldest first. */
export class MessageLog {
  private readonly capacity: number;
  private entries: LogEntry[] = [];

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  /** A repeat of the newest line bumps its counter instead of pushing older lines out. */
  add(text: string): void {
    const last = this.entries.at(-1);
    if (last?.text === text) {
      this.entries[this.entries.length - 1] = { text, count: last.count + 1, isNew: true };
      return;
    }
    this.entries.push({ text, count: 1, isNew: true });
    if (this.entries.length > this.capacity) this.entries.shift();
  }

  markAllOld(): void {
    this.entries = this.entries.map((entry) => ({ ...entry, isNew: false }));
  }

  get lines(): readonly LogEntry[] {
    return this.entries;
  }
}
