## 桌面端项目开发

### 创建项目

我需要开发一个桌面端应用，使用electron-forge进行脚手架创建，当前项目使用monorepo多包分层、单项依赖、按业务划分模块的架构原则

- 项目使用typescript + electron-forge + vite
- 需要支持工程化构建配置，包括eslint、prettier、editorconfig、原子化css、stylelint、commitlint等
- 代码提交管理使用：commitizen + commitlint + husky + cz-git
- app包中包含desktop、server文件夹，分别对应桌面端和服务器端的代码 packages中暂时先放editor-core、editor-schema两个子包 ，后续根据业务需求添加其他子包
