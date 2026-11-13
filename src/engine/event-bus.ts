type Listener<T> = (payload: T) => void;

/** Typed observer: lets the world announce what happened without knowing who listens. */
export class EventBus<Events extends object> {
  private readonly listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  /** Returns an unsubscribe function. */
  on<K extends keyof Events>(type: K, listener: Listener<Events[K]>): () => void {
    const set = this.listeners[type] ?? new Set<Listener<Events[K]>>();
    this.listeners[type] = set;
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    for (const listener of this.listeners[type] ?? []) listener(payload);
  }
}
