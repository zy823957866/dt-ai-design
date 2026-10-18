import { existsSync } from 'node:fs';
import path from 'node:path';

/** 解析 opencode 可执行命令。优先环境变量，其次常见安装位置，兜底 "opencode"。 */
export const resolveOpenCodeCommand = (): string => {
  const environment = process.env as {
    OPENCODE_CLI_PATH?: string;
    DT_OPENCODE_EXECUTABLE?: string;
    LOCALAPPDATA?: string;
  };

  const configured =
    environment.DT_OPENCODE_EXECUTABLE ?? environment.OPENCODE_CLI_PATH;
  if (configured) return configured;

  if (process.platform === 'win32' && environment.LOCALAPPDATA) {
    const candidate = path.join(
      environment.LOCALAPPDATA,
      'Programs',
      'opencode',
      'opencode.exe',
    );
    if (existsSync(candidate)) return candidate;
  }

  return 'opencode';
};
