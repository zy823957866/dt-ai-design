# dt-ai-design

基于 pnpm workspaces 的 monorepo 工程。

## 架构约定

- **多包分层**：`apps/` 放应用（desktop / server），`packages/` 放可复用子包；
- **单项依赖**：依赖只允许从上层指向下层（`apps` -> `packages`，`editor-core` -> `editor-schema`），禁止反向或循环依赖；
- **按业务划分模块**：新增业务能力时优先拆成独立子包。

## 目录结构

```text
.
├── apps/
│   ├── desktop/          # Electron 桌面端（Forge + Vite + UnoCSS）
│   │   ├── src/          # main / preload / renderer
│   │   └── uno.config.ts # UnoCSS 配置
│   └── server/           # 服务端（占位，待开发）
├── packages/
│   ├── editor-schema/    # 编辑器 Schema 包（tsdown 构建）
│   └── editor-core/      # 编辑器核心包（tsdown 构建，依赖 editor-schema）
├── .editorconfig         # 编辑器统一配置
├── .prettierrc           # Prettier 格式化配置
├── .husky/               # Git 钩子（commit-msg / pre-commit）
├── commitlint.config.mjs # commitlint + cz-git 提交规范
├── eslint.config.mjs     # ESLint（flat config）
├── stylelint.config.mjs  # Stylelint
├── tsconfig.base.json    # 共享 TypeScript 配置
└── pnpm-workspace.yaml   # workspace 配置
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
```

## 代码提交

- 提交规范：Conventional Commits，配置见 `commitlint.config.mjs`；
- 使用 `pnpm commit`（commitizen + cz-git）交互式生成规范提交信息；
- Git 钩子：`pre-commit` 执行 lint-staged（eslint / stylelint / prettier），
  `commit-msg` 执行 commitlint 校验，不符合规范会被拦截。

## 新增一个包

1. 在 `packages/` 下创建目录，命名遵循 `@dt-ai-design/<name>`；
2. 添加 `package.json`（含 `tsdown` / `typescript` devDependencies）；
3. 添加 `tsdown.config.ts` 与 `tsconfig.json`（继承根 `tsconfig.base.json`）；
4. 若需要被其他 workspace 引用，声明 `"@dt-ai-design/<name>": "workspace:*"`，
   并在 `tsconfig.base.json` 的 `paths` 中补充源码映射；
5. 在 `commitlint.config.mjs` 的 `scopes` 中加入新包名。
