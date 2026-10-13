import type { AgentEvent } from '@dt-ai-design/agent-protocol';

/**
 * 带背压的事件队列：供 provider 端写入事件，消费端按顺序读取。
 * 同时支持 pull（dequeue）和 push（订阅回调）两种消费模式。
 */
export class MessageQueue {
  private queue: AgentEvent[] = [];
  private waiters: Array<(event: AgentEvent) => void> = [];
  private done = false;

  /** 入队一个事件。如果有等待者，直接派发。 */
  enqueue(event: AgentEvent): void {
    if (this.done) return;
    if (this.waiters.length > 0) {
      const waiter = this.waiters.shift()!;
      waiter(event);
      return;
    }
    this.queue.push(event);
  }

  /** 同步出队，没有则返回 undefined。 */
  dequeue(): AgentEvent | undefined {
    return this.queue.shift();
  }

  /** 异步等待下一个事件（Promise 风格）。 */
  async next(): Promise<AgentEvent | null> {
    if (this.queue.length > 0) return this.queue.shift()!;
    if (this.done) return null;
    return new Promise((resolve) => {
      this.waiters.push((e) => resolve(e));
    });
  }

  /** 以异步迭代器方式消费所有事件。 */
  async *[Symbol.asyncIterator](): AsyncGenerator<AgentEvent> {
    while (!this.done || this.queue.length > 0) {
      const next = await this.next();
      if (next === null) break;
      yield next;
    }
  }

  get size(): number {
    return this.queue.length;
  }

  /** 标记队列已完成（不会再有新事件）。 */
  finish(): void {
    this.done = true;
    // 唤醒所有还在等的 waiter，让它们收到 null
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift()!;
      waiter(null as unknown as AgentEvent);
    }
  }
}
