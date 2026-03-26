

# ClawPanel

<p align="center">
  <img src="public/images/logo-brand.png" width="360" alt="Cpanel">
</p>

<p align="center">
  内置 AI 助手的 OpenClaw 管理面板 — 一键安装、配置、诊断、修复
</p>

<p align="center">
  <strong>🇨🇳 中文</strong> | <a href="README.en.md">🇺🇸 English</a>
</p>

<p align="center">
  <a href="https://github.com/cangerx/clawpanel/releases/latest">
    <img src="https://img.shields.io/github/v/release/cangerx/clawpanel?style=flat-square&color=16a34a" alt="Release">
  </a>
  <a href="https://github.com/cangerx/clawpanel/releases/latest">
    <img src="https://img.shields.io/github/downloads/cangerx/clawpanel/total?style=flat-square&color=22c55e" alt="Downloads">
  </a>
  <a href="https://github.com/cangerx/clawpanel/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg?style=flat-square" alt="License">
  </a>
  <a href="https://github.com/cangerx/clawpanel/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/cangerx/clawpanel/ci.yml?style=flat-square&label=CI" alt="CI">
  </a>
</p>

---

<p align="center">
  <img src="docs/feature-showcase.gif" width="800" alt="Cpanel 功能全景">
</p>

Cpanel 是 [OpenClaw](https://github.com/1186258278/OpenClawChineseTranslation) AI Agent 框架的可视化管理面板。**内置智能 AI 助手**，帮你一键安装 OpenClaw、自动诊断配置、排查问题、修复错误。8 大工具 + 4 种模式 + 交互式问答，从新手到老手都能轻松管理。

> 📦 **下载**:
> - 海外用户： [GitHub Releases](https://github.com/cangerx/clawpanel/releases/latest)
> - 国内用户： [Gitee 仓库 / 发版镜像](https://gitee.com/cangerx/clawpanel)

### 🔥 开发板 / 嵌入式设备支持

Cpanel 提供**纯 Web 部署模式**（零 GUI 依赖），适合 ARM64 开发板和嵌入式设备：

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
| EXE 安装器 | `Cpanel_x.x.x_x64-setup.exe` | 推荐，双击安装 |
| MSI 安装器 | `Cpanel_x.x.x_x64_en-US.msi` | 企业部署 / 静默安装 |

#### macOS

| 芯片 | 安装包 | 说明 |
|------|--------|------|
| Apple Silicon (M1/M2/M3/M4) | `Cpanel_x.x.x_aarch64.dmg` | 2020 年末及之后的 Mac |
| Intel | `Cpanel_x.x.x_x64.dmg` | 2020 年及之前的 Mac |

> 不确定芯片类型？点击左上角 → 关于本机，查看「芯片」一栏。

安装方式：打开 `.dmg` 文件，**先将 Cpanel 拖入「应用程序」文件夹**，再双击打开。

> **⚠️ 首次打开提示"已损坏"或"无法验证开发者"？** 由于应用未签名，macOS 会拦截。请在终端执行以下命令解除限制：
>
> ```bash
> sudo xattr -rd com.apple.quarantine /Applications/Cpanel.app
> ```
>
> 或者前往「系统设置 → 隐私与安全性」，找到 Cpanel 点击「仍要打开」。
>
> 提示 `No such file`？说明没有拖入应用程序文件夹。请先拖入，或改用：
> ```bash
> sudo xattr -rd com.apple.quarantine ~/Downloads/Cpanel.app
> ```

#### Linux Desktop

| 格式 | 安装包 | 说明 |
|------|--------|------|
| AppImage | `Cpanel_x.x.x_amd64.AppImage` | 免安装，`chmod +x` 后直接运行 |
| DEB | `Cpanel_x.x.x_amd64.deb` | Debian / Ubuntu：`sudo dpkg -i *.deb` |
| RPM | `Cpanel-x.x.x-1.x86_64.rpm` | Fedora / RHEL：`sudo rpm -i *.rpm` |

### Linux 服务器 / Web

没有桌面环境？推荐使用统一安装脚本部署或更新 Cpanel Web 版：

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

如果你已经有 Docker / Compose 环境，可以先用一条命令快速启动：

```bash
docker run -d \
  --name clawpanel \
  --restart unless-stopped \
  -p 1420:1420 \
  -v clawpanel-data:/root/.openclaw \
  node:22-slim \
  sh -c "apt-get update && apt-get install -y git && npm install -g @qingchencloud/openclaw-zh --registry https://registry.npmmirror.com && openclaw init 2>/dev/null || true && git clone https://github.com/cangerx/clawpanel.git /app && cd /app && npm install && npm run build && npm run serve"
```

访问 `http://服务器IP:1420`。生产环境建议使用 Compose，详见 [Docker 部署指南](docs/docker-deploy.md)。

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

## 功能截图

<p align="center">
  <img src="docs/quick-stats.gif" width="800" alt="Cpanel 数据概览">
</p>

<p align="center">
  <img src="docs/01.png" width="800" alt="AI 助手">
</p>
<p align="center"><em>🤖 AI 助手 — 8 大技能卡片，一键触发配置检查、Gateway 诊断、环境检测、一键排障等常用操作</em></p>

<p align="center">
  <img src="docs/00.png" width="800" alt="仪表盘">
</p>
<p align="center"><em>仪表盘 — Gateway / 隧道 / 服务实时状态，版本信息、Agent 数量、模型池一屏掌握</em></p>

<p align="center">
  <img src="docs/02.png" width="800" alt="AI 助手设置 — 公益 AI 接口">
</p>
<p align="center"><em>⚙️ AI 设置 — 独立模型配置，多服务商接入</em></p>

<p align="center">
  <img src="docs/05.png" width="800" alt="AI 助手人设 — Agent 灵魂">
</p>
<p align="center"><em>� 借尸还魂 — 从 OpenClaw Agent 加载灵魂（SOUL / IDENTITY / USER / AGENTS / TOOLS），继承人格与记忆</em></p>

<p align="center">
  <img src="docs/07.png" width="800" alt="实时聊天">
</p>
<p align="center"><em>实时聊天 — WebSocket 流式对话，多 Provider 模型自动聚合，支持多模态</em></p>

<p align="center">
  <img src="docs/09.png" width="800" alt="模型配置">
</p>
<p align="center"><em>模型配置 — 多服务商统一管理，主模型+备选自动切换</em></p>

<p align="center">
  <img src="docs/13.png" width="800" alt="记忆文件">
</p>
<p align="center"><em>记忆文件 — 工作记忆、记忆归档、核心文件在线编辑，多 Agent 记忆隔离</em></p>

<details>
<summary><strong>查看更多截图</strong></summary>

<p align="center">
  <img src="docs/10.png" width="800" alt="Agent 管理">
</p>
<p align="center"><em>Agent 管理 — 多 Agent 创建、身份配置与独立工作区管理</em></p>

<p align="center">
  <img src="docs/11.png" width="800" alt="Gateway 安全认证">
</p>
<p align="center"><em>Gateway — Token / 密码双认证，Agent 工具权限三档管控，会话可见性控制</em></p>

<p align="center">
  <img src="docs/03.png" width="800" alt="服务管理">
</p>
<p align="center"><em>服务管理 — 启停控制、版本检测、一键升级、npm 源切换、配置备份</em></p>

<p align="center">
  <img src="docs/12.png" width="800" alt="安全设置">
</p>
<p align="center"><em>安全设置 — 访问密码保护与无视风险模式</em></p>

<p align="center">
  <img src="docs/14.png" width="800" alt="扩展工具">
</p>
<p align="center"><em>扩展工具 — cftunnel 内网穿透、ClawApp 移动客户端一键安装</em></p>

<p align="center">
  <img src="docs/15.png" width="800" alt="系统诊断">
</p>
<p align="center"><em>系统诊断 — 全面健康检测、WebSocket 测试、一键修复配对</em></p>

<p align="center">
  <img src="docs/16.png" width="800" alt="关于">
</p>
<p align="center"><em>关于 — 版本信息、社群入口（QQ / 微信 / 抖音）、相关项目链接</em></p>

</details>

## 🤖 AI 助手亮点

Cpanel 内置的 AI 助手不只是聊天机器人——它能**直接操作你的系统**，帮你诊断、修复、甚至提交 PR。

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

首次启动 Cpanel 会自动进入**初始设置**页面，引导你完成环境检测：

- ✅ **Node.js** — 自动检测，未安装时提供一键安装
- ✅ **Git** — 自动检测并配置 HTTPS 模式
- ✅ **OpenClaw** — 一键安装，可选汉化版或原版

### 2. 配置 AI 模型

进入**模型配置**页面，添加至少一个 AI 服务商（DeepSeek、OpenAI、阿里通义、Ollama 等）。

### 3. 启动 Gateway

前往**服务管理**页面，点击「启动」按钮启动 Gateway。

### 4. 开始聊天

前往**实时聊天**页面，选择模型后即可开始对话。支持流式输出、Markdown 渲染、多模态图片识别。

---

## Linux 服务器部署

Linux 服务器推荐使用统一入口 `deploy.sh` 进行安装或更新：

- **海外用户（GitHub）**

```bash
curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash
```

- **国内用户（Gitee）**

```bash
curl -fsSL https://gitee.com/cangerx/clawpanel/raw/main/deploy.sh | bash
```

脚本会自动处理下载、依赖安装、生产构建，并优先选择 `systemd`、`systemd --user` 或 `nohup` 作为后台运行方式。

📖 详细环境变量、反向代理和故障排查，请见 [Linux 部署指南](docs/linux-deploy.md)

## 消息渠道配置

Cpanel 支持将 AI 接入多种即时通讯平台，在「消息渠道」页面统一管理。

### 支持的平台

| 平台 | 类型 | 说明 |
|------|------|------|
| Telegram | Bot | 通过 @BotFather 创建 Bot |
| Discord | Bot | 需创建 Application + Bot |
| 飞书 / Lark | 企业内部应用 | 支持内置插件和官方插件两种模式 |
| 钉钉 | 企业内部应用 | Stream 模式，需创建机器人应用 |
| QQ 机器人 | 官方 Bot | 需在 QQ 开放平台注册 |
| 微信 | 官方插件 | 腾讯微信团队官方 OpenClaw 插件，扫码即用 |
| 企业微信 (WeCom) | 企业应用 | 企业微信官方插件 |
| WhatsApp | Web Bridge | WhatsApp Web 桥接，内置支持 |
| Slack | App | Socket Mode 连接 |
| Signal | CLI / REST | Signal CLI 或 REST API 桥接 |
| Google Chat | Workspace | Google Workspace 服务账号 |
| iMessage (BlueBubbles) | macOS | 通过 BlueBubbles Server 桥接 iMessage |
| LINE | Messaging API | LINE 官方 Messaging API |
| Microsoft Teams | Bot Framework | Teams Bot 接入 |
| Matrix | 开放协议 | Element 等 Matrix 客户端 |
| Mattermost | 团队协作 | Mattermost 平台接入 |
| IRC | 传统协议 | IRC 服务器频道 |
| Twitch | 直播聊天 | Twitch 直播间聊天 |
| WebChat | 内置 | 内置 Web 聊天界面 |

### 配置步骤（以飞书为例）

1. 在飞书开放平台创建**企业自建应用**，开启**机器人**能力
2. 获取 `App ID` 和 `App Secret`
3. 在 Cpanel「消息渠道」页面选择飞书，填入凭证
4. 点击「校验」确认连接，然后「保存」
5. Gateway 会自动重载，飞书机器人即刻可用

> 📖 详细教程：[飞书接入指南](docs/dingtalk-integration.md) | [钉钉接入指南](docs/dingtalk-integration.md)

### 注意事项

- 消息渠道需要 **Gateway 正在运行**才能接收消息
- 每个平台需要**配对审批**才能连接（在渠道设置中完成）
- 飞书/钉钉需要在对应平台**发布应用版本**后，机器人才对其他人可见

---

## 常见问题

### macOS 提示"已损坏，无法打开"

```bash
sudo xattr -rd com.apple.quarantine /Applications/Cpanel.app
```

或前往「系统设置 → 隐私与安全性」点击「仍要打开」。

### macOS 检测不到 Node.js

从 Finder/Dock 启动 Cpanel 时，应用的 PATH 环境变量可能不包含 Node.js 安装路径。

**v0.4.1 已修复**：自动补充 `/usr/local/bin`、`/opt/homebrew/bin`、`~/.nvm`、`~/.volta` 等常见路径。

临时解决：从终端启动 Cpanel：

```bash
open /Applications/Cpanel.app
```

### Windows 安装 OpenClaw 报 ENOENT (-4058)

通常是文件权限或 npm 缓存问题：

1. 以管理员身份运行 Cpanel
2. 或打开 PowerShell（管理员）手动安装：
   ```powershell
   npm install -g @qingchencloud/openclaw-zh --registry https://registry.npmmirror.com
   ```
3. 如果仍报错，清理 npm 缓存：`npm cache clean --force`

### Windows 安装报 exit 128 (access rights)

npm 依赖需要 Git。如果已装 Git 但仍报 128，是因为依赖用了 SSH 协议拉代码但你没配 GitHub SSH Key。运行以下命令改用 HTTPS：

```powershell
git config --global url."https://github.com/".insteadOf ssh://git@github.com/
git config --global url."https://github.com/".insteadOf git@github.com:
```

没装 Git 的请先安装 [Git for Windows](https://git-scm.com/download/win)。**v0.4.2+ 已自动配置 HTTPS 模式。**

### Windows 安装报 EPERM (operation not permitted)

文件被其他进程锁定。先关闭 Cpanel 和所有 Node.js 进程，以管理员身份打开 PowerShell 重装：

```powershell
npm cache clean --force
npm install -g @qingchencloud/openclaw-zh --registry https://registry.npmmirror.com
```

### 安装后 Node.js 检测不到（Windows）

安装 Node.js 后需要**重启 Cpanel**，新的 PATH 环境变量才能生效。

如果安装在非默认路径（如 `D:\nodejs`、`F:\AI\Node`），请确认该目录已加入系统 PATH 环境变量。**v0.4.2+ 已自动扫描常见安装路径。**

### Gateway 启动失败

1. 检查端口 18789 是否被占用：`pkill -f openclaw` 后重启
2. 查看「日志查看」页面的 Gateway 日志获取详细错误信息

### 模型连接超时 / 测试失败

1. **检查 API Key** — 确认 Key 未过期、余额充足
2. **检查 Base URL** — 不同服务商 URL 格式不同，注意结尾不要多 `/v1`（Cpanel 会自动处理）
3. **网络问题** — 国内访问 OpenAI 需要代理；DeepSeek / 阿里通义 / Ollama 国内直连
4. **Ollama 特殊处理** — URL 填 `http://127.0.0.1:11434`（不加 `/v1`，Cpanel 自动补全）

### WebSocket 断连 / 聊天无响应

1. 确认 Gateway 正在运行（顶部状态栏显示绿色）
2. 反向代理需要配置 WebSocket 支持（参见上方 Nginx 配置）
3. 如果使用 HTTPS，WebSocket 需要 `wss://` 协议（v0.7.3+ 已自动适配）
4. 清除浏览器缓存后刷新页面

### Web 版报"未实现的命令"

升级到 **v0.8.5+**。旧版本的 Web 后端缺少部分命令实现，v0.8.5 已补全所有 handler。

```bash
cd /opt/clawpanel  # 替换为实际安装目录
git pull origin main
npm install
npm run build
sudo systemctl restart clawpanel  # 或 pm2 restart clawpanel
```

### 消息渠道保存后不生效

1. 确认 Gateway 正在运行
2. 飞书/钉钉：需要在对应开放平台**发布应用版本**
3. 飞书：私聊测试需在「工作台」搜索机器人名称；群聊需通过「群设置 → 智能群助手」添加
4. 钉钉：消息接收模式必须选择 **Stream 模式**

## 相关项目

| 项目 | 说明 |
|------|------|
| [OpenClaw](https://github.com/1186258278/OpenClawChineseTranslation) | AI Agent 框架 |
| [ClawApp](https://github.com/qingchencloud/clawapp) | 跨平台移动聊天客户端 |
| [cftunnel](https://github.com/qingchencloud/cftunnel) | Cloudflare Tunnel 内网穿透工具 |

## 贡献

欢迎提交 Issue 和 Pull Request。贡献流程详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 致谢

Cpanel 的成长离不开每一位贡献者的付出。感谢你们让这个项目变得更好！

### 🛠 代码贡献者

感谢以下开发者提交 Pull Request，直接参与了代码建设：

<table>
  <tr>
    <td align="center"><a href="https://github.com/liucong2013"><img src="https://github.com/liucong2013.png?size=80" width="60" height="60" style="border-radius:50%"><br><sub><b>liucong2013</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/88">#88</a></td>
    <td align="center"><a href="https://github.com/axdlee"><img src="https://github.com/axdlee.png?size=80" width="60" height="60" style="border-radius:50%"><br><sub><b>axdlee</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/58">#58</a></td>
    <td align="center"><a href="https://github.com/ATGCS"><img src="https://github.com/ATGCS.png?size=80" width="60" height="60" style="border-radius:50%"><br><sub><b>ATGCS</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/107">#107</a></td>
    <td align="center"><a href="https://github.com/livisun"><img src="https://github.com/livisun.png?size=80" width="60" height="60" style="border-radius:50%"><br><sub><b>livisun</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/106">#106</a></td>
    <td align="center"><a href="https://github.com/kiss-kedaya"><img src="https://github.com/kiss-kedaya.png?size=80" width="60" height="60" style="border-radius:50%"><br><sub><b>kiss-kedaya</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/101">#101</a> <a href="https://github.com/cangerx/clawpanel/pull/94">#94</a></td>
    <td align="center"><a href="https://github.com/wzh4869"><img src="https://github.com/wzh4869.png?size=80" width="60" height="60" style="border-radius:50%"><br><sub><b>wzh4869</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/82">#82</a></td>
    <td align="center"><a href="https://github.com/0xsline"><img src="https://github.com/0xsline.png?size=80" width="60" height="60" style="border-radius:50%"><br><sub><b>0xsline</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/15">#15</a></td>
    <td align="center"><a href="https://github.com/jonntd"><img src="https://github.com/jonntd.png?size=80" width="60" height="60" style="border-radius:50%"><br><sub><b>jonntd</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/18">#18</a></td>
  </tr>
</table>

### 🐛 社区反馈者

感谢以下用户提交 Issue 报告 Bug 或建议功能，帮助 Cpanel 持续改进：

<a href="https://github.com/asfork"><img src="https://github.com/asfork.png?size=40" width="32" height="32" title="asfork"></a>
<a href="https://github.com/p1ayer222"><img src="https://github.com/p1ayer222.png?size=40" width="32" height="32" title="p1ayer222"></a>
<a href="https://github.com/ntescn"><img src="https://github.com/ntescn.png?size=40" width="32" height="32" title="ntescn"></a>
<a href="https://github.com/song860"><img src="https://github.com/song860.png?size=40" width="32" height="32" title="song860"></a>
<a href="https://github.com/gtgc2005"><img src="https://github.com/gtgc2005.png?size=40" width="32" height="32" title="gtgc2005"></a>
<a href="https://github.com/Eternity714"><img src="https://github.com/Eternity714.png?size=40" width="32" height="32" title="Eternity714"></a>
<a href="https://github.com/flyingnight"><img src="https://github.com/flyingnight.png?size=40" width="32" height="32" title="flyingnight"></a>
<a href="https://github.com/genan1989"><img src="https://github.com/genan1989.png?size=40" width="32" height="32" title="genan1989"></a>
<a href="https://github.com/alexluoli"><img src="https://github.com/alexluoli.png?size=40" width="32" height="32" title="alexluoli"></a>
<a href="https://github.com/iethancode"><img src="https://github.com/iethancode.png?size=40" width="32" height="32" title="iethancode"></a>
<a href="https://github.com/glive1991-bit"><img src="https://github.com/glive1991-bit.png?size=40" width="32" height="32" title="glive1991-bit"></a>
<a href="https://github.com/hYRamos"><img src="https://github.com/hYRamos.png?size=40" width="32" height="32" title="hYRamos"></a>
<a href="https://github.com/htone8"><img src="https://github.com/htone8.png?size=40" width="32" height="32" title="htone8"></a>
<a href="https://github.com/evanervx"><img src="https://github.com/evanervx.png?size=40" width="32" height="32" title="evanervx"></a>
<a href="https://github.com/qjman524"><img src="https://github.com/qjman524.png?size=40" width="32" height="32" title="qjman524"></a>
<a href="https://github.com/yahwist00"><img src="https://github.com/yahwist00.png?size=40" width="32" height="32" title="yahwist00"></a>
<a href="https://github.com/catfishlty"><img src="https://github.com/catfishlty.png?size=40" width="32" height="32" title="catfishlty"></a>
<a href="https://github.com/ufoleon"><img src="https://github.com/ufoleon.png?size=40" width="32" height="32" title="ufoleon"></a>
<a href="https://github.com/fengzhao"><img src="https://github.com/fengzhao.png?size=40" width="32" height="32" title="fengzhao"></a>
<a href="https://github.com/nicoxia"><img src="https://github.com/nicoxia.png?size=40" width="32" height="32" title="nicoxia"></a>
<a href="https://github.com/friendfish"><img src="https://github.com/friendfish.png?size=40" width="32" height="32" title="friendfish"></a>
<a href="https://github.com/pdsy520"><img src="https://github.com/pdsy520.png?size=40" width="32" height="32" title="pdsy520"></a>
<a href="https://github.com/CaoJingBiao"><img src="https://github.com/CaoJingBiao.png?size=40" width="32" height="32" title="CaoJingBiao"></a>
<a href="https://github.com/LwdAmazing"><img src="https://github.com/LwdAmazing.png?size=40" width="32" height="32" title="LwdAmazing"></a>
<a href="https://github.com/joeshen2021"><img src="https://github.com/joeshen2021.png?size=40" width="32" height="32" title="joeshen2021"></a>
<a href="https://github.com/Qentin39"><img src="https://github.com/Qentin39.png?size=40" width="32" height="32" title="Qentin39"></a>
<a href="https://github.com/wzgrx"><img src="https://github.com/wzgrx.png?size=40" width="32" height="32" title="wzgrx"></a>
<a href="https://github.com/aixinjie"><img src="https://github.com/aixinjie.png?size=40" width="32" height="32" title="aixinjie"></a>
<a href="https://github.com/wangziqi7"><img src="https://github.com/wangziqi7.png?size=40" width="32" height="32" title="wangziqi7"></a>
<a href="https://github.com/kizuzz"><img src="https://github.com/kizuzz.png?size=40" width="32" height="32" title="kizuzz"></a>
<a href="https://github.com/lizheng31"><img src="https://github.com/lizheng31.png?size=40" width="32" height="32" title="lizheng31"></a>
<a href="https://github.com/Yafeiml"><img src="https://github.com/Yafeiml.png?size=40" width="32" height="32" title="Yafeiml"></a>
<a href="https://github.com/ethanbase"><img src="https://github.com/ethanbase.png?size=40" width="32" height="32" title="ethanbase"></a>
<a href="https://github.com/BBcactus"><img src="https://github.com/BBcactus.png?size=40" width="32" height="32" title="BBcactus"></a>
<a href="https://github.com/AGLcaicai"><img src="https://github.com/AGLcaicai.png?size=40" width="32" height="32" title="AGLcaicai"></a>
<a href="https://github.com/zhugeafu"><img src="https://github.com/zhugeafu.png?size=40" width="32" height="32" title="zhugeafu"></a>
<a href="https://github.com/sc-yx"><img src="https://github.com/sc-yx.png?size=40" width="32" height="32" title="sc-yx"></a>
<a href="https://github.com/themeke"><img src="https://github.com/themeke.png?size=40" width="32" height="32" title="themeke"></a>
<a href="https://github.com/erlangzhang"><img src="https://github.com/erlangzhang.png?size=40" width="32" height="32" title="erlangzhang"></a>
<a href="https://github.com/YamanZzz"><img src="https://github.com/YamanZzz.png?size=40" width="32" height="32" title="YamanZzz"></a>
<a href="https://github.com/huanghun5172"><img src="https://github.com/huanghun5172.png?size=40" width="32" height="32" title="huanghun5172"></a>
<a href="https://github.com/kongjian19930520"><img src="https://github.com/kongjian19930520.png?size=40" width="32" height="32" title="kongjian19930520"></a>
<a href="https://github.com/XIAzhenglin"><img src="https://github.com/XIAzhenglin.png?size=40" width="32" height="32" title="XIAzhenglin"></a>
<a href="https://github.com/dacj4n"><img src="https://github.com/dacj4n.png?size=40" width="32" height="32" title="dacj4n"></a>
<a href="https://github.com/lzzandsx"><img src="https://github.com/lzzandsx.png?size=40" width="32" height="32" title="lzzandsx"></a>
<a href="https://github.com/qiangua5210"><img src="https://github.com/qiangua5210.png?size=40" width="32" height="32" title="qiangua5210"></a>
<a href="https://github.com/yzswk"><img src="https://github.com/yzswk.png?size=40" width="32" height="32" title="yzswk"></a>
<a href="https://github.com/nasvip"><img src="https://github.com/nasvip.png?size=40" width="32" height="32" title="nasvip"></a>
<a href="https://github.com/yyy22335"><img src="https://github.com/yyy22335.png?size=40" width="32" height="32" title="yyy22335"></a>
<a href="https://github.com/yuanjie408"><img src="https://github.com/yuanjie408.png?size=40" width="32" height="32" title="yuanjie408"></a>
<a href="https://github.com/qingahan"><img src="https://github.com/qingahan.png?size=40" width="32" height="32" title="qingahan"></a>
<a href="https://github.com/mentho7"><img src="https://github.com/mentho7.png?size=40" width="32" height="32" title="mentho7"></a>
<a href="https://github.com/AspirantH"><img src="https://github.com/AspirantH.png?size=40" width="32" height="32" title="AspirantH"></a>
<a href="https://github.com/skkjkk"><img src="https://github.com/skkjkk.png?size=40" width="32" height="32" title="skkjkk"></a>
<a href="https://github.com/penghaiqiu1988"><img src="https://github.com/penghaiqiu1988.png?size=40" width="32" height="32" title="penghaiqiu1988"></a>
<a href="https://github.com/cfx2020"><img src="https://github.com/cfx2020.png?size=40" width="32" height="32" title="cfx2020"></a>
<a href="https://github.com/birdxs"><img src="https://github.com/birdxs.png?size=40" width="32" height="32" title="birdxs"></a>
<a href="https://github.com/szuforti"><img src="https://github.com/szuforti.png?size=40" width="32" height="32" title="szuforti"></a>
<a href="https://github.com/baiyucraft"><img src="https://github.com/baiyucraft.png?size=40" width="32" height="32" title="baiyucraft"></a>
<a href="https://github.com/arnzh"><img src="https://github.com/arnzh.png?size=40" width="32" height="32" title="arnzh"></a>
<a href="https://github.com/xyiqq"><img src="https://github.com/xyiqq.png?size=40" width="32" height="32" title="xyiqq"></a>
<a href="https://github.com/tonyzhangbo78"><img src="https://github.com/tonyzhangbo78.png?size=40" width="32" height="32" title="tonyzhangbo78"></a>
<a href="https://github.com/try-to"><img src="https://github.com/try-to.png?size=40" width="32" height="32" title="try-to"></a>
<a href="https://github.com/irunmyway"><img src="https://github.com/irunmyway.png?size=40" width="32" height="32" title="irunmyway"></a>
<a href="https://github.com/Oliveelick"><img src="https://github.com/Oliveelick.png?size=40" width="32" height="32" title="Oliveelick"></a>
<a href="https://github.com/56025192"><img src="https://github.com/56025192.png?size=40" width="32" height="32" title="56025192"></a>
<a href="https://github.com/aliceQWAS"><img src="https://github.com/aliceQWAS.png?size=40" width="32" height="32" title="aliceQWAS"></a>
<a href="https://github.com/qingdeng888"><img src="https://github.com/qingdeng888.png?size=40" width="32" height="32" title="qingdeng888"></a>
<a href="https://github.com/18574707971"><img src="https://github.com/18574707971.png?size=40" width="32" height="32" title="18574707971"></a>

> 如果遗漏了你的贡献，请 [提交 Issue](https://github.com/cangerx/clawpanel/issues/new) 告知我们，我们会第一时间补充！

## 许可证

本项目采用 [AGPL-3.0](LICENSE) 开源协议。
