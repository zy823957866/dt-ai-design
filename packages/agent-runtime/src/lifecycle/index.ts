import type {
  AgentEvent,
  AgentState,
  AgentStage,
} from '@dt-ai-design/agent-protocol';

export type EventListener = (event: AgentEvent) => void;

/**
 * Agent 运行时：管理一次会话的生命周期、状态流转与事件总线。
 *
 * 状态机：idle → planning → executing → validating → completed / failed
 */
export class AgentRun {
  readonly sessionId: string;
  private state: AgentState;
  private listeners = new Set<EventListener>();
  private seq = 0;
  private cancelled = false;
  private cancelCallbacks: Array<() => void> = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.state = {
      sessionId,
      stage: 'idle',
      updatedAt: Date.now(),
    };
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getStage(): AgentStage {
    return this.state.stage;
  }

  isCancelled(): boolean {
    return this.cancelled;
  }

  /** 订阅所有事件。返回取消订阅函数。 */
  onEvent(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 注册取消回调（供 provider / executor 在取消时清理资源）。 */
  onCancel(cb: () => void): void {
    this.cancelCallbacks.push(cb);
    if (this.cancelled) cb();
  }

  /** 切换到指定阶段并发送事件。 */
  setStage(stage: AgentStage, currentStep?: string): void {
    this.state = {
      ...this.state,
      stage,
      currentStep,
      updatedAt: Date.now(),
    };
    this.emit({
      type: 'agent:step',
      payload: { stage, currentStep },
    });
  }

  /** 发送自定义事件（带自增 seq）。 */
  emit(event: Omit<AgentEvent, 'sessionId' | 'seq' | 'timestamp'>): void {
    const full: AgentEvent = {
      ...event,
      sessionId: this.sessionId,
      seq: ++this.seq,
      timestamp: Date.now(),
    };
    for (const listener of this.listeners) {
      try {
        listener(full);
      } catch {
        /* swallow listener errors */
      }
    }
  }

  /** 标记完成。 */
  complete(payload?: unknown): void {
    this.state = {
      ...this.state,
      stage: 'completed',
      updatedAt: Date.now(),
    };
    this.emit({ type: 'agent:completed', payload: payload ?? {} });
  }

  /** 标记失败。 */
  fail(error: string | Error): void {
    const message = error instanceof Error ? error.message : String(error);
    this.state = {
      ...this.state,
      stage: 'failed',
      updatedAt: Date.now(),
    };
    this.emit({ type: 'agent:failed', payload: { error: message } });
  }

  /** 取消当前执行。同步触发所有 onCancel 回调。 */
  cancel(): void {
    if (this.cancelled) return;
    this.cancelled = true;
    for (const cb of this.cancelCallbacks) {
      try {
        cb();
      } catch {
        /* swallow */
      }
    }
    this.state = {
      ...this.state,
      stage: 'failed',
      updatedAt: Date.now(),
    };
    this.emit({
      type: 'agent:failed',
      payload: { error: 'Cancelled by user', cancelled: true },
    });
  }

  /** 在事件总线上声明一个 plan 事件（规划产物）。 */
  setPlan(payload: unknown): void {
    this.emit({ type: 'agent:plan', payload });
  }

  /** 启动 run，发送 started 事件并进入 planning 阶段。 */
  start(): void {
    this.emit({ type: 'agent:started', payload: {} });
    this.setStage('planning');
  }
}

/** Run 管理器：维护会话 id → run 的映射。 */
export class RunManager {
  private runs = new Map<string, AgentRun>();

  create(sessionId: string): AgentRun {
    const run = new AgentRun(sessionId);
    this.runs.set(sessionId, run);
    return run;
  }

  get(sessionId: string): AgentRun | undefined {
    return this.runs.get(sessionId);
  }

  remove(sessionId: string): boolean {
    return this.runs.delete(sessionId);
  }

  /** 取消并清理所有 run。 */
  shutdown(): void {
    for (const run of this.runs.values()) run.cancel();
    this.runs.clear();
  }
}
