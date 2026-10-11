import type { DesignDocument } from '@dt-ai-design/design-schema';
import type { EditorState } from './types';

/**
 * 命令接口 —— 所有编辑器命令都实现此接口
 *
 * 命令是可撤销的操作单元，封装了对文档的修改逻辑。
 */
export interface Command {
  /** 命令名称，用于调试/展示 */
  name: string;
  /**
   * 执行命令，返回新的文档状态
   * @param state 当前编辑器状态
   * @returns 执行后的文档
   */
  execute(state: EditorState): DesignDocument;
  /**
   * 撤销命令，返回撤销后的文档状态
   * @param state 当前编辑器状态
   * @returns 撤销后的文档
   */
  undo(state: EditorState): DesignDocument;
}

/**
 * 命令栈 —— 管理 undo/redo 历史
 *
 * 使用快照式历史：每次执行命令前保存文档快照到 undo 栈，
 * 撤销时将快照还原，并把当前文档推入 redo 栈。
 * 实现简单可靠，适合设计文档这种 JSON 数据结构。
 */
export class CommandStack {
  private state: EditorState;

  constructor(state: EditorState) {
    this.state = state;
  }

  /** 执行一个命令，推入 undo 栈，清空 redo 栈 */
  execute(command: Command): void {
    const { history, document } = this.state;

    // 保存当前文档到 undo 栈
    history.undoStack.push(JSON.parse(JSON.stringify(document)));

    // 限制最大历史记录数
    if (history.undoStack.length > history.maxHistory) {
      history.undoStack.shift();
    }

    // 执行命令
    this.state.document = command.execute(this.state);

    // 清空 redo 栈（新操作后之前的重做失效）
    history.redoStack = [];
  }

  /** 撤销上一个命令 */
  undo(): boolean {
    const { history } = this.state;
    if (history.undoStack.length === 0) return false;

    // 当前文档推入 redo 栈
    history.redoStack.push(JSON.parse(JSON.stringify(this.state.document)));

    // 从 undo 栈弹出上一个状态
    const prev = history.undoStack.pop()!;
    this.state.document = prev;

    return true;
  }

  /** 重做上一个撤销的命令 */
  redo(): boolean {
    const { history } = this.state;
    if (history.redoStack.length === 0) return false;

    // 当前文档推入 undo 栈
    history.undoStack.push(JSON.parse(JSON.stringify(this.state.document)));

    // 从 redo 栈弹出下一个状态
    const next = history.redoStack.pop()!;
    this.state.document = next;

    return true;
  }

  /** 是否可以撤销 */
  canUndo(): boolean {
    return this.state.history.undoStack.length > 0;
  }

  /** 是否可以重做 */
  canRedo(): boolean {
    return this.state.history.redoStack.length > 0;
  }
}
