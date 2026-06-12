// Storage layer. Mirrors the schema in docs/details.md "Storage Model".
// The engine is in-memory (the toolkit's blessed default persistence — the
// swap point for SQLite/Redis is this one class; handler code only sees the
// query methods). A fresh Store is created per bot, so the harness gets full
// isolation between specs.

export type ChatType = "private" | "group" | "channel";

export interface Subscriber {
  chatId: number;
  chatType: ChatType;
  /** ISO-8601, set on first subscribe and preserved across re-subscribes. */
  subscribedAt: string;
}

export class Store {
  readonly subscribers = new Map<number, Subscriber>();

  /** Idempotent upsert (details.md): re-subscribing keeps the original row. */
  addSubscriber(chatId: number, chatType: ChatType): Subscriber {
    let s = this.subscribers.get(chatId);
    if (!s) {
      s = { chatId, chatType, subscribedAt: new Date().toISOString() };
      this.subscribers.set(chatId, s);
    }
    return s;
  }

  /** Idempotent remove: unsubscribing an unknown chat is a no-op. */
  removeSubscriber(chatId: number): void {
    this.subscribers.delete(chatId);
  }

  listSubscribers(): Subscriber[] {
    return [...this.subscribers.values()].sort((a, b) => a.chatId - b.chatId);
  }
}
