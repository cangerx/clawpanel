# ClawPanel Linux 部署指南

本文介绍如何在 Linux 服务器上部署 **ClawPanel Web 版**，通过浏览器远程管理 OpenClaw。

适用场景：云服务器、NAS、家庭 HomeLab、无 GUI 的 Linux 主机。

> **ClawPanel** 提供 Windows / macOS / Linux 桌面安装包；本文聚焦 Linux 服务器上的 Web 部署方式，通过构建后的前端 + `scripts/serve.js` 运行，适合无桌面环境的常驻部署。

---

## 目录

- [前提条件](#前提条件)
- [方式一：统一一键部署（推荐）](#方式一统一一键部署推荐)
- [方式二：手动部署](#方式二手动部署)
- [方式三：Docker 部署](#方式三docker-部署)
- [后台运行模式](#后台运行模式)
- [Nginx 反向代理](#nginx-反向代理)
- [防火墙配置](#防火墙配置)
- [更新升级](#更新升级)
- [常见问题](#常见问题)

---

## 前提条件

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | 18+ | 推荐 22 LTS |
| npm | 随 Node.js | 包管理器 |
| Git | 可选 | 仅在源码包下载失败时作为回退 clone 使用 |
| OpenClaw | 最新 | ClawPanel 管理的对象 |

---

## 方式一：统一一键部署（推荐）

统一安装入口：

```bash
curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash
# 国内网络可改用 Gitee 镜像：
# curl -fsSL https://gitee.com/cangerx/clawpanel/raw/main/deploy.sh | bash
```

脚本会自动完成：

1. 检查 `node` / `npm` / `tar`
2. 下载源码（失败时自动回退 `git clone`）
3. 安装依赖并执行生产构建
4. 选择最合适的后台运行方式并立即启动
5. 输出访问地址、运行模式、状态命令和日志命令

默认行为：

- **Linux root**：安装到 `/opt/clawpanel`，创建 `systemd` 系统服务
- **Linux 普通用户**：安装到 `~/.local/share/clawpanel`，创建 `systemd --user` 服务
- **无 systemd 环境**：回退到 `nohup`，在安装目录下维护 `.run/clawpanel.pid` 和 `.run/clawpanel.log`
- **无法后台托管**：打印手动启动命令作为最终兜底

部署完成后通常已经在后台运行，可直接访问：

```text
http://服务器IP:1420
```

### 常用环境变量

```bash
# 修改端口
CLAWPANEL_PORT=3000 curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash

# 仅监听本机
CLAWPANEL_HOST=127.0.0.1 curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash

# 指定安装目录
CLAWPANEL_DIR=/srv/clawpanel curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash

# 安装指定 tag
CLAWPANEL_REF=v1.0.0 curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash

# 国内网络也可将上面的 GitHub 原始地址替换为：
# https://gitee.com/cangerx/clawpanel/raw/main/deploy.sh
```

---

## 方式二：手动部署

### 1. 安装 Node.js

**Ubuntu / Debian：**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS / RHEL / Fedora：**

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs
```

**Alpine：**

```bash
apk add nodejs npm git
```

验证安装：

```bash
node -v
npm -v
```

### 2. 安装 OpenClaw

ClawPanel 是 OpenClaw 的管理工具，需要先安装 OpenClaw：

```bash
npm install -g @qingchencloud/openclaw-zh --registry https://registry.npmmirror.com
```

首次初始化：

```bash
openclaw init
```

### 3. 获取并安装 ClawPanel

```bash
git clone https://github.com/cangerx/clawpanel.git
cd clawpanel
npm install
npm run build
```

### 4. 启动 Web 服务

```bash
npm run serve -- --host 0.0.0.0 --port 1420
```

自定义端口：

```bash
npm run serve -- --port 8080
```

如果想手动常驻运行，推荐自己配置 `systemd`、`pm2` 或其它进程管理器。更省事的方式还是直接使用上面的一键部署脚本。

---

## 方式三：Docker 部署

> 📖 Docker 完整教程（Compose、自定义镜像、数据持久化等）见 [Docker 部署指南](docker-deploy.md)

快速启动：

```bash
docker run -d \
  --name clawpanel \
  --restart unless-stopped \
  -p 1420:1420 \
  -v clawpanel-data:/root/.openclaw \
  node:22-slim \
  sh -c "apt-get update && apt-get install -y git && \
    npm install -g @qingchencloud/openclaw-zh --registry https://registry.npmmirror.com && \
    git clone https://github.com/cangerx/clawpanel.git /app && \
    cd /app && npm install && npm run build && npm run serve"
```

---

## 后台运行模式

统一安装脚本会自动选择以下模式之一：

### 1. `systemd`

适用于 Linux root 安装。

常用命令：

```bash
systemctl status clawpanel
systemctl restart clawpanel
systemctl stop clawpanel
journalctl -u clawpanel -f
```

服务文件默认位于：

```text
/etc/systemd/system/clawpanel.service
```

### 2. `systemd --user`

适用于 Linux 普通用户安装。

常用命令：

```bash
systemctl --user status clawpanel
systemctl --user restart clawpanel
systemctl --user stop clawpanel
journalctl --user -u clawpanel -f
```

服务文件默认位于：

```text
~/.config/systemd/user/clawpanel.service
```

脚本会尝试执行 `loginctl enable-linger <user>`，让用户服务在退出登录后继续运行；如果系统策略不允许，也不影响当前会话内启动。

### 3. `nohup`

适用于没有 `systemd` 但支持后台进程的环境。

运行状态文件默认位于安装目录：

```text
<install-dir>/.run/clawpanel.pid
<install-dir>/.run/clawpanel.log
```

常用命令示例：

```bash
ps -p "$(cat /path/to/clawpanel/.run/clawpanel.pid)" -o pid=,etime=,command=
tail -f /path/to/clawpanel/.run/clawpanel.log
kill "$(cat /path/to/clawpanel/.run/clawpanel.pid)"
```

重复执行安装脚本时，会优先替换已存在的 `nohup` 实例，避免留下重复进程。

### 4. 手动兜底

如果当前环境既不能用 `systemd`，也无法可靠地后台托管，脚本会输出类似下面的命令：

```bash
cd /path/to/clawpanel && npm run serve -- --host 0.0.0.0 --port 1420
```

---

## Nginx 反向代理

如果希望用域名 + HTTPS 访问 ClawPanel：

```nginx
server {
    listen 80;
    server_name panel.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:1420;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> **重要：** 必须配置 WebSocket 升级（`Upgrade` + `Connection`），否则 ClawPanel 无法连接 Gateway。

配合 Let's Encrypt 启用 HTTPS：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d panel.yourdomain.com
```

---

## 防火墙配置

### UFW (Ubuntu/Debian)

```bash
sudo ufw allow 1420/tcp
sudo ufw allow 18789/tcp
```

### firewalld (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=1420/tcp
sudo firewall-cmd --reload
```

---

## 更新升级

### 更新 ClawPanel

推荐直接重新执行统一安装脚本：

```bash
curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash
```

它会重新同步源码、安装依赖、重新构建，并更新后台运行实例。

如果你是手动部署，也可以手动执行：

```bash
cd /opt/clawpanel        # 或你的实际安装目录
git pull origin main
npm install
npm run build
systemctl restart clawpanel    # 或 systemctl --user restart clawpanel
```

### 更新 OpenClaw

**方式一：在 ClawPanel 面板中操作**（推荐）

打开「关于」页面 → 点击版本管理，优先切换到当前面板绑定的推荐稳定版。面板会自动处理 sudo 权限、镜像源与 Git HTTPS 兼容。

**方式二：命令行手动升级**

```bash
sudo npm install -g @qingchencloud/openclaw-zh@2026.3.7-zh.2 --registry https://registry.npmmirror.com
sudo npm install -g openclaw@2026.3.11 --registry https://registry.npmjs.org
```

---

## 常见问题

### Q: 端口 1420 被占用？

```bash
lsof -i :1420
```

然后改端口重新部署：

```bash
CLAWPANEL_PORT=3000 curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash
```

### Q: 为什么安装完成后不需要再手动执行 `npm run serve`？

因为统一安装脚本会在构建完成后自动选择后台运行模式，并立即启动服务。只有在当前环境不支持自动托管时，才会输出手动启动命令。

### Q: 如何查看当前是 `systemd` 还是 `nohup`？

安装脚本结束时会打印 `运行模式`，同时给出对应的状态/日志命令。

### Q: 无法使用 `systemctl --user`？

通常是当前会话没有可用的 user bus，或者主机策略禁止 linger。脚本会自动回退到 `nohup`，你仍然可以继续使用 ClawPanel。

### Q: 打开面板显示 `openclaw.json` 不存在？

需要先安装 OpenClaw 并初始化：

```bash
npm install -g @qingchencloud/openclaw-zh --registry https://registry.npmmirror.com
openclaw init
```

### Q: Gateway 启动/停止按钮不工作？

确保：

- `openclaw` 命令在 PATH 中
- 运行 ClawPanel 的用户有权限操作进程

```bash
which openclaw
openclaw --version
```

### Q: 从外网无法访问？

1. 检查防火墙是否放行端口 `1420`
2. 检查云服务器安全组是否已开放端口
3. 生产环境建议使用 Nginx 反向代理 + HTTPS

### Q: 如何同时启动 Gateway 和 ClawPanel？

它们是独立进程：

- ClawPanel 由统一安装脚本自动常驻
- Gateway 仍需你自己启动，或在面板里点击启动按钮管理

例如：

```bash
openclaw gateway start
```

### Q: 与桌面版有什么区别？

| 功能 | 桌面版 (Win/Mac) | Web 版 (Linux) |
|------|-----------------|----------------|
| 配置管理 | ✅ | ✅ |
| Gateway 管理 | ✅ | ✅ |
| 模型测试 | ✅ | ✅ |
| 日志查看 | ✅ | ✅ |
| 备份管理 | ✅ | ✅ |
| Agent 记忆 | ✅ | ✅ |
| ZIP 导出 | ✅ | ❌ |
| 系统托盘 | ✅ | ❌ |
| 自动更新 | ✅ | 重新执行部署脚本 |
