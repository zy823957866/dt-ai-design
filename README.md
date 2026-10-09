# dt-ai-design

基于 pnpm workspaces 的 monorepo，目标是「AI 驱动的设计工具」：AI Agent 接收设计意图，拆解为可执行步骤，通过时间线内核（`editor-core`）以命令方式生成 / 修改设计文档。

## 分层架构

依赖只允许从上层指向下层（禁止反向或循环依赖）：

```text
apps (desktop / server)
  └── agent-provider-codex      接入层 · 不同模型（Codex 等）的适配
        └── agent-orchestrator  编排层 · planner 拆任务 / executor 执行 / validator 校验
              └── agent-runtime 运行时层 · agent 生命周期 / 消息队列 / 上下文管理
                    ├── agent-protocol  协议层 · 事件 / 命令 / 状态的类型契约
                    └── editor-core     时间线内核 · DSL 数据模型 + command 体系
                          └── design-schema  DSL 数据模型定义
```

| 层           | 包                     | 职责                                                |
| ------------ | ---------------------- | --------------------------------------------------- |
| 接入层       | `agent-provider-codex` | 不同模型的适配器，把编排结果翻译为具体模型请求      |
| 编排层       | `agent-orchestrator`   | `planner` 拆任务、`executor` 执行、`validator` 校验 |
| 运行时层     | `agent-runtime`        | agent 生命周期、消息队列、上下文管理                |
| 协议层       | `agent-protocol`       | 事件、命令、状态的类型契约定义                      |
| 时间线内核   | `editor-core`          | 时间线内核 + command 体系（依赖 design-schema）     |
| DSL 数据模型 | `design-schema`        | 设计文档的 DSL 数据模型定义                         |

## 目录结构

```text
.
├── apps/
│   ├── desktop/                  # Electron 桌面端（Forge + Vite + UnoCSS）
│   │   ├── src/                  # main / preload / renderer
│   │   └── uno.config.ts         # UnoCSS 配置
│   └── server/                   # 服务端（占位，待开发）
├── packages/
│   ├── agent-provider-codex/     # 接入层：模型适配
│   │   └── src/adapters/         #   codex.ts 等
│   ├── agent-orchestrator/       # 编排层
│   │   └── src/
│   │       ├── planner/          #   任务拆分
│   │       ├── executor/         #   步骤执行
│   │       └── validator/        #   结果校验
│   ├── agent-runtime/            # 运行时层
│   │   └── src/
│   │       ├── lifecycle/        #   agent 生命周期
│   │       ├── queue/            #   消息队列
│   │       └── context/          #   上下文管理
│   ├── agent-protocol/           # 协议层
│   │   └── src/
│   │       ├── events.ts         #   事件契约
│   │       ├── commands.ts       #   命令契约
│   │       └── states.ts         #   状态契约
│   ├── editor-core/              # 时间线内核 + command 体系
│   └── design-schema/            # DSL 数据模型
├── doc/                          # 文档
├── .editorconfig                 # 编辑器统一配置
├── .prettierrc                   # Prettier 格式化配置
├── .husky/                       # Git 钩子（commit-msg / pre-commit）
├── commitlint.config.mjs         # commitlint + cz-git 提交规范
├── eslint.config.mjs             # ESLint（flat config）
├── stylelint.config.mjs          # Stylelint
├── tsconfig.base.json            # 共享 TypeScript 配置
└── pnpm-workspace.yaml           # workspace 配置
```

## 环境要求

- Node.js >= 22
- pnpm >= 12（`packageManager` 已锁定 `pnpm@12.5.1`）
- Git（husky 需要，`pnpm install` 会自动安装 Git 钩子）

> `.npmrc` 中配置了国内 npm 与 Electron 二进制镜像，如需切换官方源可移除。
>
> 国内网络下 `electron-forge` 打包时下载 Electron 发行包可能较慢，
> 可设置环境变量加速：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`。

## 常用命令

```bash
pnpm install                # 安装全部 workspace 依赖（并安装 Git 钩子）
pnpm dev                    # 启动桌面端（electron-forge start）
pnpm build:packages         # 构建 packages 下所有包（tsdown）
pnpm build                  # 构建 packages 并打包桌面端
pnpm typecheck              # 全仓类型检查
pnpm lint                   # ESLint + Stylelint
pnpm lint:fix               # 自动修复 lint 问题
pnpm format                 # Prettier 格式化
pnpm format:check           # 检查格式化
pnpm commit                 # 交互式提交（commitizen + cz-git）
```

按 workspace 执行命令：

```bash
pnpm --filter @dt-ai-design/desktop start
pnpm --filter @dt-ai-design/editor-core build
pnpm --filter @dt-ai-design/agent-orchestrator typecheck
```

## 代码提交

- 提交规范：Conventional Commits，配置见 `commitlint.config.mjs`；
- 使用 `pnpm commit`（commitizen + cz-git）交互式生成规范提交信息；
- Git 钩子：`pre-commit` 执行 lint-staged（eslint / stylelint / prettier），
  `commit-msg` 执行 commitlint 校验，不符合规范会被拦截。

## 新增一个包

1. 在 `packages/` 下创建目录，命名遵循 `@dt-ai-design/<name>`；
2. 明确包所属分层，只允许依赖其下层包（参见「分层架构」）；
3. 添加 `package.json`（含 `tsdown` / `typescript` devDependencies，以及下层 workspace 依赖）；
4. 添加 `tsdown.config.ts` 与 `tsconfig.json`（继承根 `tsconfig.base.json`）；
5. 在 `tsconfig.base.json` 的 `paths` 中补充源码映射；
6. 在 `commitlint.config.mjs` 的 `scopes` 中加入新包名。
