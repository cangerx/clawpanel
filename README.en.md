<p align="center">
  <img src="public/images/logo-brand.png" width="360" alt="ClawPanel">
</p>

<p align="center">
  OpenClaw Management Panel with Built-in AI Assistant — One-click Install, Configure, Diagnose & Fix
</p>

<p align="center">
  <a href="README.md">🇨🇳 中文</a> | <strong>🇺🇸 English</strong>
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

<p align="center">
  <img src="docs/feature-showcase.gif" width="800" alt="ClawPanel Feature Showcase">
</p>

ClawPanel is a visual management panel for the [OpenClaw](https://openclaw.ai) AI Agent framework. It features a **built-in intelligent AI assistant** that helps you install OpenClaw with one click, auto-diagnose configurations, troubleshoot issues, and fix errors. 8 tools + 4 modes + interactive Q&A — easy to manage for beginners and experts alike.

> 📦 **Download**:
> - Overseas users: [GitHub Releases](https://github.com/cangerx/clawpanel/releases/latest)
> - Mainland China users: [Gitee repository / release mirror](https://gitee.com/cangerx/clawpanel)

## Installation

Choose the installation path that matches your platform or deployment scenario:

> **Release and download policy**: GitHub Releases is the primary release channel for overseas users, while Gitee is published in parallel as the mainland China mirror for downloads and install scripts.

### Desktop App

Download the latest installer from [GitHub Releases](https://github.com/cangerx/clawpanel/releases/latest).

#### Windows

| Format | Package | Notes |
|--------|---------|-------|
| EXE installer | `ClawPanel_x.x.x_x64-setup.exe` | Recommended for most users |
| MSI installer | `ClawPanel_x.x.x_x64_en-US.msi` | Enterprise deployment / silent install |

#### macOS

| Chip | Package | Notes |
|------|---------|-------|
| Apple Silicon (M1/M2/M3/M4) | `ClawPanel_x.x.x_aarch64.dmg` | Macs released in late 2020 and later |
| Intel | `ClawPanel_x.x.x_x64.dmg` | Older Intel-based Macs |

Open the `.dmg`, drag ClawPanel into **Applications**, then launch it.

> **⚠️ First launch says “damaged” or “developer cannot be verified”?** The app is currently unsigned, so macOS may block it. Run:
>
> ```bash
> sudo xattr -rd com.apple.quarantine /Applications/ClawPanel.app
> ```
>
> Or go to **System Settings → Privacy & Security** and click **Open Anyway**.

#### Linux Desktop

| Format | Package | Notes |
|--------|---------|-------|
| AppImage | `ClawPanel_x.x.x_amd64.AppImage` | Portable, run after `chmod +x` |
| DEB | `ClawPanel_x.x.x_amd64.deb` | Debian / Ubuntu |
| RPM | `ClawPanel-x.x.x-1.x86_64.rpm` | Fedora / RHEL |

### Linux Server / Web

For headless Linux servers, install or update ClawPanel Web with the canonical entry point:

- **Overseas users (GitHub)**

```bash
curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash
```

- **Mainland China users (Gitee)**

```bash
curl -fsSL https://gitee.com/cangerx/clawpanel/raw/main/deploy.sh | bash
```

The script automatically chooses the best background runtime (`systemd`, `systemd --user`, or `nohup`) and prints the access URL, status commands, and log commands after deployment.

📖 Full guide: [Linux Deployment Guide](docs/linux-deploy.md)

### ARM / Embedded

ARM64 boards also use the **Web mode** rather than desktop packages. Use the same `deploy.sh` entry point above for production deployments.

If you only want to run the source tree manually, see [Web Development (No Rust/Tauri Required)](#web-development-no-rusttauri-required).

📖 Full guide: [Armbian / ARM Deployment Guide](docs/armbian-deploy.md)

### Docker

If you already use Docker or Compose, keep README as the overview and use the dedicated guide for commands and production examples.

📖 Full guide: [Docker Deployment Guide](docs/docker-deploy.md)

## Features

### Dashboard & Monitoring
- **Real-time Dashboard** — Gateway status, version info, agent fleet, model pool, service health at a glance
- **Log Viewer** — Real-time Gateway logs with search and filtering
- **System Diagnostics** — Auto-detect configuration issues, WebSocket connectivity, pairing status

### AI Assistant (Built-in)
- **8 Built-in Tools** — Terminal execution, file read/write, directory browsing, web search, URL fetching, system info, process management, port checking
- **4 Modes** — Full auto, semi-auto, read-only, chat-only
- **Tool Calling** — AI can directly execute commands, read logs, modify configs to diagnose and fix problems

### Model Configuration
- **Multi-Provider** — OpenAI, Anthropic, DeepSeek, Google Gemini, Ollama, SiliconFlow, Volcengine, Alibaba Cloud, and more
- **One-click Model Add** — Browse and select models from provider catalogs
- **Model Testing** — Test any model with a single click before deploying
- **Primary/Fallback** — Set primary model with automatic fallback to alternatives

### Agent Management
- **Multi-Agent** — Create and manage multiple AI agents with independent workspaces
- **Identity & Personality** — Configure name, emoji, model for each agent
- **Memory Files** — Manage SOUL.md, IDENTITY.md, AGENTS.md workspace files
- **Workspace Isolation** — Each agent has its own memory, tools, and configuration

### Messaging Channels (18 Platforms)
- **QQ Bot** — Built-in QQ robot integration via QQ Open Platform
- **Telegram** — Bot Token authentication
- **Discord** — Bot with guild/channel management
- **Feishu/Lark** — Enterprise messaging with WebSocket mode
- **DingTalk** — Enterprise app with Stream mode robot
- **WeChat** — Official Tencent WeChat OpenClaw plugin, scan QR to connect
- **WeCom** — WeChat Work (Enterprise WeChat) official plugin
- **WhatsApp** — WhatsApp Web bridge, built-in support
- **Slack** — Slack App with Socket Mode
- **Signal** — Signal CLI / REST API bridge
- **Google Chat** — Google Workspace Service Account
- **iMessage (BlueBubbles)** — iMessage via BlueBubbles Server (macOS)
- **LINE** — LINE Messaging API
- **Microsoft Teams** — Teams Bot via Bot Framework
- **Matrix** — Matrix protocol (Element etc.)
- **Mattermost** — Mattermost team collaboration
- **IRC** — IRC server channels
- **Twitch** — Twitch live chat
- **WebChat** — Built-in web chat UI
- **Multi-Account** — Bind different accounts to different agents

### Gateway & Services
- **Gateway Control** — Start, stop, restart OpenClaw Gateway
- **Auto-Guardian** — Automatic Gateway restart on unexpected exit (with cooldown)
- **Config Editor** — Direct JSON editor for openclaw.json with syntax validation
- **Backup & Restore** — One-click configuration backup and restore

### Cron Jobs
- **Scheduled Tasks** — Create cron-based scheduled AI tasks
- **Delivery Channels** — Route task results to messaging channels
- **Per-Agent Assignment** — Assign tasks to specific agents

### Security
- **Access Password** — Protect Web panel with password authentication
- **Network Proxy** — Configure HTTP/SOCKS proxy for all outbound requests
- **Session Management** — Secure session tokens with expiration

## Quick Start

1. Install and open ClawPanel
2. On first run, it auto-detects your Node.js environment and OpenClaw CLI
3. If OpenClaw is not installed, click one-click install
4. After installation, the dashboard loads automatically

> **Requirements**: Node.js 18+ (22 LTS recommended)

## Tech Stack

- **Frontend**: Vanilla JS + CSS Custom Properties (zero framework dependency)
- **Desktop**: Tauri v2 (Rust backend)
- **Web Backend**: Node.js (Express-compatible API server)
- **Build**: Vite
- **CI/CD**: GitHub Actions (cross-platform builds)

## Development

```bash
# Prerequisites: Node.js 22+, Rust toolchain, Tauri CLI

# Clone
git clone https://github.com/cangerx/clawpanel.git
cd clawpanel

# Install dependencies
npm install

# Desktop development (Tauri)
npm run tauri dev
```

### Web Development (No Rust/Tauri Required)

If you only want frontend development or manual source-based Web runs, you do not need Rust:

```bash
# Development mode with hot reload
npm run dev
# Open http://localhost:1420

# Build production assets
npm run build

# Manually serve the built Web app
npm run serve
```

`npm run serve` here is for **development or manual self-managed runs**. For Linux servers, ARM devices, or long-running production installs, use the `deploy.sh` installation entry point in the Installation section above.

## Contributing

Issues and Pull Requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Acknowledgements

ClawPanel keeps growing because of every contributor in the community. Thank you for helping make the project better.

### Code Contributors

Thanks to these developers for submitting Pull Requests and contributing directly to the codebase:

<table>
  <tr>
    <td align="center"><a href="https://github.com/liucong2013"><img src="https://github.com/liucong2013.png?size=80" width="60" height="60"><br><sub><b>liucong2013</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/88">#88</a></td>
    <td align="center"><a href="https://github.com/axdlee"><img src="https://github.com/axdlee.png?size=80" width="60" height="60"><br><sub><b>axdlee</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/58">#58</a></td>
    <td align="center"><a href="https://github.com/ATGCS"><img src="https://github.com/ATGCS.png?size=80" width="60" height="60"><br><sub><b>ATGCS</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/107">#107</a></td>
    <td align="center"><a href="https://github.com/livisun"><img src="https://github.com/livisun.png?size=80" width="60" height="60"><br><sub><b>livisun</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/106">#106</a></td>
    <td align="center"><a href="https://github.com/kiss-kedaya"><img src="https://github.com/kiss-kedaya.png?size=80" width="60" height="60"><br><sub><b>kiss-kedaya</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/101">#101</a> <a href="https://github.com/cangerx/clawpanel/pull/94">#94</a></td>
    <td align="center"><a href="https://github.com/wzh4869"><img src="https://github.com/wzh4869.png?size=80" width="60" height="60"><br><sub><b>wzh4869</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/82">#82</a></td>
    <td align="center"><a href="https://github.com/0xsline"><img src="https://github.com/0xsline.png?size=80" width="60" height="60"><br><sub><b>0xsline</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/15">#15</a></td>
    <td align="center"><a href="https://github.com/jonntd"><img src="https://github.com/jonntd.png?size=80" width="60" height="60"><br><sub><b>jonntd</b></sub></a><br><a href="https://github.com/cangerx/clawpanel/pull/18">#18</a></td>
  </tr>
</table>

### Community Reporters

Thanks to community members who opened issues, reported bugs, and suggested features:

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

> If we missed your contribution, please [open an issue](https://github.com/cangerx/clawpanel/issues/new) and we will add it promptly.

## License

This project is licensed under [AGPL-3.0](LICENSE).
