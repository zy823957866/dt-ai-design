/** Agent 运行阶段（协议层契约）。 */
export type AgentStage =
  | 'idle'
  | 'planning'
  | 'editing'
  | 'executing'
  | 'verifying'
  | 'validating'
  | 'completed'
  | 'failed';

export interface AgentState {
  sessionId: string;
  stage: AgentStage;
  /** 当前执行的步骤描述（可选）。 */
  currentStep?: string;
  updatedAt: number;
}
