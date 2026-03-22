# ClawPanel 改造记录 (2026-03-23)

## v0.9.8 更新内容

### 新功能

#### Gateway 启动诊断 + 一键修复
- 新增 `diagnose_gateway` 接口，自动检测 6 项启动条件：CLI 二进制、配置文件、plist/systemd 状态、入口文件有效性、端口冲突、僵尸进程、最近错误日志
- 新增 `fix_gateway` 接口，自动杀残留进程、清理服务状态、重新启动并验证结果
- `start_service` 不再盲目返回成功，改为等待 2 秒后验证实际启动状态
- 仪表盘 Gateway 卡片新增"诊断"按钮，启动失败自动弹出诊断面板
- 诊断面板显示各项检查结果（✓/✗），可修复项提供"一键修复"按钮
- 全部跨平台兼容：macOS (launchctl) / Linux (systemd) / Windows (PowerShell)

#### 插件安装容错机制
- 新增 `fallbackInstallPlugin()` 备用安装方案
- 当 `openclaw plugins install` 因缺少 `openclaw.extensions` 字段失败时，自动回退到直接 `npm install` + 补丁 package.json
- 覆盖所有插件安装入口：渠道插件、QQ Bot 插件、SSE 流式安装、技能市场插件
- 安装后增加目录验证，失败时明确提示用户

#### 消息渠道扩展至 18 个平台
新增支持：微信（腾讯官方插件）、企业微信、WhatsApp、Slack、Signal、Google Chat、iMessage (BlueBubbles)、LINE、Microsoft Teams、Matrix、Mattermost、IRC、Twitch、WebChat

### 优化

#### UI 全局优化
- 新增设计 token：`--shadow-card`、`--shadow-card-hover`、`--shadow-glow`、`--bg-card-gradient`
- 按钮：focus-visible 轮廓、hover 浮起发光、active 按压反馈
- 卡片：统一阴影体系 + hover 浮起效果
- Toast 通知：彩色左边框、滑入/滑出动画、backdrop-blur
- Modal 弹窗：更强 backdrop blur (8px)
- 侧边栏：backdrop-filter blur(12px)、活跃项左侧 indigo 指示条

### 修复
- 修复 Gateway plist 入口文件路径不匹配导致无法启动的问题
- 修复 macOS `macStartService` 吞掉所有错误始终返回 `true` 的问题

### 文档
- 仓库引用全部更新为 `cangerx/clawpanel`
- 移除推广内容（赞助商广告、社区群二维码、晴辰云服务推广、公司版权声明）
- 消息渠道文档从 5 个平台更新为 18 个平台完整列表
- package.json / Cargo.toml 仓库地址同步更新

### 涉及文件

| 文件 | 改动 |
|------|------|
| `scripts/dev-api.js` | 诊断/修复 handler、start_service 改进、插件 fallback、跨平台兼容 |
| `src/pages/dashboard.js` | 诊断 UI、启动失败自动诊断 |
| `src/pages/channels.js` | 18 平台渠道注册表 |
| `src/lib/tauri-api.js` | 新增 diagnoseGateway / fixGateway API |
| `src/style/pages.css` | 诊断面板样式 |
| `src/style/variables.css` | 设计 token |
| `src/style/components.css` | 组件样式优化 |
| `src/style/layout.css` | 布局样式优化 |
| `README.md` | 仓库引用、推广清理、渠道列表 |
| `README.en.md` | 同上英文版 |
| `CONTRIBUTING.md` | 仓库引用更新 |
| `SECURITY.md` | 仓库引用更新 |
| `docs/*.md` | 部署文档仓库引用更新 |
| `package.json` | 版本号 + 仓库地址 |
| `src-tauri/tauri.conf.json` | 版本号 |
| `src-tauri/Cargo.toml` | 版本号 + 仓库地址 |
