import type { AgentEvent } from '@dt-ai-design/agent-protocol';

/** Agent 消息队列（占位实现）。 */
export class MessageQueue {
  private queue: AgentEvent[] = [];

  enqueue(event: AgentEvent): void {
    this.queue.push(event);
  }

  dequeue(): AgentEvent | undefined {
    return this.queue.shift();
  }

  get size(): number {
    return this.queue.length;
  }
}
