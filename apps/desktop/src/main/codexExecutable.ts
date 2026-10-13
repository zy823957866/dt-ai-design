import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * 解析 codex 可执行命令。
 *
 * 优先级：
 * 1. 环境变量 DT_CODEX_EXECUTABLE / CODEX_CLI_PATH（显式指定，支持 .exe 或命令名）
 * 2. Windows 常见安装位置（ChatGPT 桌面版自带 / WindowsApps）
 * 3. 兜底 "codex"（由 CodexProvider 在 win32 下经 cmd.exe 代理执行）
 */
export const resolveCodexCommand = (): string => {
  const environment = process.env as {
    CODEX_CLI_PATH?: string;
    DT_CODEX_EXECUTABLE?: string;
    LOCALAPPDATA?: string;
  };

  const configured =
    environment.DT_CODEX_EXECUTABLE ?? environment.CODEX_CLI_PATH;
  if (configured) return configured;

  if (process.platform === 'win32' && environment.LOCALAPPDATA) {
    const candidates = [
      path.join(
        environment.LOCALAPPDATA,
        'Programs',
        'ChatGPT',
        'resources',
        'codex.exe',
      ),
      path.join(
        environment.LOCALAPPDATA,
        'Microsoft',
        'WindowsApps',
        'codex.exe',
      ),
    ];
    const found = candidates.find((candidate) => existsSync(candidate));
    if (found) return found;
  }

  return 'codex';
};
