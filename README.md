

# ClawPanel

<p align="center">
  <img src="public/images/logo-brand.png" width="360" alt="ClawPanel">
</p>

<p align="center">
  内置 AI 助手的 OpenClaw 管理面板 — 一键安装、配置、诊断、修复
</p>

<p align="center">
  <strong>🇨🇳 中文</strong> | <a href="README.en.md">🇺🇸 English</a>
</p>

<p align="center">
  <a href="https://github.com/cangerx/clawpanel/releases/latest">
    <img src="https://img.shields.io/github/v/release/cangerx/clawpanel?style=flat-square&color=6366f1" alt="Release">
  </a>
  <a href="https://github.com/cangerx/clawpanel/releases/latest">
    <img src="https://img.shields.io/github/downloads/cangerx/clawpanel/total?style=flat-square&color=8b5cf6" alt="Downloads">
  </a>
  <a href="https://github.com/cangerx/clawpanel/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg?style=flat-square" alt="License">
  </a>
  <a href="https://github.com/cangerx/clawpanel/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/cangerx/clawpanel/ci.yml?style=flat-square&label=CI" alt="CI">
  </a>
</p>

---

ClawPanel 是 [OpenClaw](https://github.com/1186258278/OpenClawChineseTranslation) AI Agent 框架的可视化管理面板。**内置智能 AI 助手**，帮你一键安装 OpenClaw、自动诊断配置、排查问题、修复错误。8 大工具 + 4 种模式 + 交互式问答，从新手到老手都能轻松管理。

> 📦 **下载**:
> - 海外用户： [GitHub Releases](https://github.com/cangerx/clawpanel/releases/latest)
> - 国内用户： [Gitee 仓库 / 发版镜像](https://gitee.com/cangerx/clawpanel)

### 🔥 开发板 / 嵌入式设备支持

ClawPanel 提供**纯 Web 部署模式**（零 GUI 依赖），适合 ARM64 开发板和嵌入式设备：

- **Orange Pi / 树莓派 / RK3588** 等 ARM64 板子 — 推荐走 Linux Web 一键部署入口 `deploy.sh`
- **Armbian / Debian / Ubuntu Server** — 统一使用根目录 `deploy.sh`，脚本会自动检测架构并选择后台运行方式
- **Docker ARM64 环境** — 详见 [Docker 部署指南](docs/docker-deploy.md)
- 无需 Rust / Tauri / 图形界面，**只要有 Node.js 18+ 就能跑**

> 📖 ARM 设备详见 [Armbian 部署指南](docs/armbian-deploy.md)；Linux 服务器通用入口见 [Linux 部署指南](docs/linux-deploy.md)

## 安装方式

### Desktop App

#### Windows

| 格式 | 安装包 | 说明 |
|------|--------|------|
| EXE 安装器 | `ClawPanel_x.x.x_x64-setup.exe` | 推荐，双击安装 |
| MSI 安装器 | `ClawPanel_x.x.x_x64_en-US.msi` | 企业部署 / 静默安装 |

#### macOS

| 芯片 | 安装包 | 说明 |
|------|--------|------|
| Apple Silicon (M1/M2/M3/M4) | `ClawPanel_x.x.x_aarch64.dmg` | 2020 年末及之后的 Mac |
| Intel | `ClawPanel_x.x.x_x64.dmg` | 2020 年及之前的 Mac |

> 不确定芯片类型？点击左上角 → 关于本机，查看「芯片」一栏。

安装方式：打开 `.dmg` 文件，**先将 ClawPanel 拖入「应用程序」文件夹**，再双击打开。

> **⚠️ 首次打开提示"已损坏"或"无法验证开发者"？** 由于应用未签名，macOS 会拦截。请在终端执行以下命令解除限制：
>
> ```bash
> sudo xattr -rd com.apple.quarantine /Applications/ClawPanel.app
> ```

#### Linux Desktop

| 格式 | 安装包 | 说明 |
|------|--------|------|
| AppImage | `ClawPanel_x.x.x_amd64.AppImage` | 免安装，`chmod +x` 后直接运行 |
| DEB | `ClawPanel_x.x.x_amd64.deb` | Debian / Ubuntu：`sudo dpkg -i *.deb` |
| RPM | `ClawPanel-x.x.x-1.x86_64.rpm` | Fedora / RHEL：`sudo rpm -i *.rpm` |

### Linux 服务器 / Web

没有桌面环境？推荐使用统一安装脚本部署或更新 ClawPanel Web 版：

- **海外用户（GitHub）**

```bash
curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash
```

- **国内用户（Gitee）**

```bash
curl -fsSL https://gitee.com/cangerx/clawpanel/raw/main/deploy.sh | bash
```

脚本会自动选择最合适的后台运行方式（`systemd` / `systemd --user` / `nohup`），并输出访问地址、状态命令和日志命令。

📖 详细教程见 [Linux 部署指南](docs/linux-deploy.md)

### Docker

如果你已经有 Docker / Compose 环境，详见 [Docker 部署指南](docs/docker-deploy.md)。

## 功能特性

- **🤖 AI 助手（全新·重磅）** — 内置独立 AI 助手，4 种操作模式 + 8 大工具 + 交互式问答
- **🖼️ 图片识别** — 粘贴截图或拖拽图片，AI 自动识别分析，支持多模态图文混排对话
- **仪表盘** — 系统概览，服务状态实时监控，快捷操作
- **服务管理** — OpenClaw 启停控制、版本检测与一键升级、Gateway 安装/卸载、配置备份与还原
- **模型配置** — 多服务商管理、模型增删改查、批量连通性测试、延迟检测、拖拽排序、自动保存+撤销
- **网关配置** — 端口、访问权限（本机/局域网）、认证 Token、Tailscale 组网
- **消息渠道（18 平台）** — Telegram、Discord、飞书、钉钉、QQ、微信、企业微信、WhatsApp、Slack、Signal、Google Chat、iMessage (BlueBubbles)、LINE、Teams、Matrix、Mattermost、IRC、Twitch
- **通信与自动化** — 消息设置、广播策略、斜杠命令、Webhook、执行审批转发等高级配置
- **使用情况** — Token 用量、API 费用、热门模型/服务商/工具排行、每日用量图表
- **Agent 管理** — Agent 增删改查、身份编辑、模型配置、工作区管理
- **聊天** — 流式响应、Markdown 渲染、会话管理、/fast /think /verbose /reasoning 命令
- **定时任务** — Cron 定时执行，支持多渠道投递
- **日志查看** — 多日志源实时查看与关键词搜索
- **记忆管理** — 记忆文件查看/编辑、分类管理、ZIP 导出、Agent 切换
- **扩展工具** — cftunnel 内网穿透管理、ClawApp 状态监控
- **关于** — 版本信息、社群入口、相关项目链接、一键升级

## 🤖 AI 助手亮点

ClawPanel 内置的 AI 助手不只是聊天机器人——它能**直接操作你的系统**，帮你诊断、修复、甚至提交 PR。

### 四种操作模式

| 模式 | 图标 | 工具 | 写文件 | 确认 | 适用场景 |
|------|------|------|--------|------|---------|
| **聊天** | 💬 | ❌ | ❌ | — | 纯问答，不触碰系统 |
| **规划** | 📋 | ✅ | ❌ | ✅ | 读配置/查日志，输出方案不动文件 |
| **执行** | ⚡ | ✅ | ✅ | ✅ | 正常干活，危险操作弹确认 |
| **无限** | ∞ | ✅ | ✅ | ❌ | 全自动，工具调用不弹窗 |

### 八大工具

| 工具 | 功能 |
|------|------|
| `ask_user` | 向用户提问（单选/多选/文本） |
| `get_system_info` | 获取 OS、架构、主目录 |
| `run_command` | 执行 Shell 命令 |
| `read_file` | 读取文件 |
| `write_file` | 写入文件 |
| `list_directory` | 浏览目录 |
| `list_processes` | 查看进程 |
| `check_port` | 检测端口占用 |

### 内置技能卡片

| 技能 | 功能 |
|------|------|
| 🔧 检查配置 | 读取并分析 openclaw.json |
| 🏥 诊断 Gateway | 检查进程、端口、日志 |
| 📂 浏览目录 | 查看 .openclaw 目录结构 |
| 💻 检查环境 | Node.js、npm 版本检测 |
| 📋 分析日志 | 搜索 ERROR/WARN 关键词 |
| 🔨 一键排障 | 自动检测并修复常见问题 |
| 🐛 提交 Bug | 整理 Issue 提交到 GitHub |
| 🔀 PR 助手 | 定位 Bug 并生成修复 PR |

## 技术架构

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vanilla JS + Vite | 零框架依赖，轻量快速 |
| 后端 | Rust + Tauri v2 | 原生性能，跨平台打包 |
| 通信 | Tauri IPC + Shell Plugin | 前后端桥接，本地命令执行 |
| 样式 | 纯 CSS（CSS Variables） | 暗色/亮色主题，玻璃拟态风格 |

```
clawpanel/
├── src/                    # 前端源码
│   ├── pages/              # 页面模块
│   ├── components/         # 通用组件
│   ├── lib/                # 工具库
│   ├── style/              # 样式文件
│   └── router.js           # 路由
├── src-tauri/              # Rust 后端
│   ├── src/commands/       # Tauri 命令
│   └── Cargo.toml          # Rust 依赖
├── public/                 # 静态资源
├── scripts/                # 开发与构建脚本
├── deploy.sh               # Linux 一键部署
└── index.html              # HTML 入口
```

## 从源码构建

### 前置条件

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Tauri v2 系统依赖

### 安装与开发

```bash
git clone https://github.com/cangerx/clawpanel.git
# 国内网络可改用 Gitee 镜像
cd clawpanel
npm install
```

#### macOS / Linux

```bash
# 启动完整 Tauri 桌面应用
./scripts/dev.sh

# 仅启动 Vite 前端（浏览器调试）
./scripts/dev.sh web
```

#### Windows

```powershell
# 启动完整 Tauri 桌面应用
npm run tauri dev

# 仅启动 Vite 前端
npm run dev
```

### 构建

```bash
# 编译正式发布版本
./scripts/build.sh release
```

产物位于 `src-tauri/target/release/` 目录。

### Web 开发版（无需 Rust/Tauri）

```bash
# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build

# 手动启动 Web 服务
npm run serve
```

## 快速上手

### 1. 初始设置

首次启动 ClawPanel 会自动进入**初始设置**页面，引导你完成环境检测：

- ✅ **Node.js** — 自动检测，未安装时提供一键安装
- ✅ **Git** — 自动检测并配置 HTTPS 模式
- ✅ **OpenClaw** — 一键安装，可选汉化版或原版

### 2. 配置 AI 模型

进入**模型配置**页面，添加至少一个 AI 服务商（DeepSeek、OpenAI、阿里通义、Ollama 等）。

### 3. 启动 Gateway

前往**服务管理**页面，点击「启动」按钮启动 Gateway。

### 4. 开始聊天

前往**实时聊天**页面，选择模型后即可开始对话。

## 常见问题

### macOS 提示"已损坏，无法打开"

```bash
sudo xattr -rd com.apple.quarantine /Applications/ClawPanel.app
```

### Gateway 启动失败

1. 检查端口 18789 是否被占用：`pkill -f openclaw` 后重启
2. 查看「日志查看」页面的 Gateway 日志获取详细错误信息

### 模型连接超时 / 测试失败

1. 检查 API Key 是否正确、余额是否充足
2. 检查 Base URL 格式是否正确
3. 网络问题：国内访问 OpenAI 需要代理

## 相关项目

| 项目 | 说明 |
|------|------|
| [OpenClaw](https://github.com/1186258278/OpenClawChineseTranslation) | AI Agent 框架 |
| [ClawApp](https://github.com/qingchencloud/clawapp) | 跨平台移动聊天客户端 |
| [cftunnel](https://github.com/qingchencloud/cftunnel) | Cloudflare Tunnel 内网穿透工具 |

## 许可证

本项目采用 [AGPL-3.0](LICENSE) 开源协议。