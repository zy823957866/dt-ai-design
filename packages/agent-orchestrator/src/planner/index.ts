import type { AgentCommand } from '@dt-ai-design/agent-protocol';

/** 任务拆分器（占位实现）：把大命令拆成可执行的小步骤。 */
export class Planner {
  plan(command: AgentCommand): string[] {
    // TODO: 根据 command.payload 拆分出步骤 id 列表
    return [command.commandId];
  }
}
