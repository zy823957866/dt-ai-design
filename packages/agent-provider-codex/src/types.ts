/** Codex CLI 接入层类型（转发 core 契约，保持既有命名兼容）。 */
import type {
  AgentAccess,
  AgentActivity,
  AgentConversation,
  AgentExecEvent,
  AgentExecRequest,
  AgentExecResult,
} from '@dt-ai-design/agent-provider-core';

export type CodexSandbox = AgentAccess;
export type CodexConversation = AgentConversation;
export type CodexActivity = AgentActivity;
export type CodexExecEvent = AgentExecEvent;
export type CodexExecRequest = AgentExecRequest;
export type CodexExecResult = AgentExecResult;
export { AgentExecError as CodexExecError } from '@dt-ai-design/agent-provider-core';
export type { AgentErrorCode as CodexErrorCode } from '@dt-ai-design/agent-provider-core';
