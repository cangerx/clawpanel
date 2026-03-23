#!/bin/bash
# ClawPanel Web 版快速安装/更新脚本
# 适用于 macOS / Linux / WSL / Docker / 远程服务器
# 用法: curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash

set -e

REPO="cangerx/clawpanel"
INSTALL_DIR="${CLAWPANEL_DIR:-$HOME/.clawpanel-web}"
PORT="${CLAWPANEL_PORT:-1420}"
REF="${CLAWPANEL_REF:-main}"

echo ""
echo "  ClawPanel Web 版 一键部署脚本"
echo "  =============================="
echo ""

# ── 工具函数 ──
fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    echo "❌ 需要 curl 或 wget，请先安装"; exit 1
  fi
}

download() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$2" "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$2" "$1"
  fi
}

# ── 检查依赖 ──
echo "[1/5] 检查依赖..."
command -v node >/dev/null 2>&1 || { echo "❌ 需要 Node.js，请先安装: https://nodejs.org/"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ 需要 npm"; exit 1; }
echo "  node $(node -v) / npm $(npm -v)"

# ── 获取安装目标 ──
echo "[2/5] 准备安装目标..."
if [ "$REF" = "main" ]; then
  DOWNLOAD_URL="https://github.com/$REPO/archive/refs/heads/main.tar.gz"
  VERSION_LABEL="main"
  echo "  安装目标: 最新主线 main"
else
  DOWNLOAD_URL="https://github.com/$REPO/archive/refs/tags/$REF.tar.gz"
  VERSION_LABEL="$REF"
  echo "  安装目标: 指定版本 $REF"
fi

# ── 下载并解压 ──
echo "[3/5] 下载源码..."
TMP_DIR=$(mktemp -d /tmp/clawpanel-XXXXXX)
TMP_FILE="$TMP_DIR/clawpanel.tar.gz"
TMP_EXTRACT="$TMP_DIR/extracted"
trap 'rm -rf "$TMP_DIR"' EXIT
mkdir -p "$INSTALL_DIR"
download "$DOWNLOAD_URL" "$TMP_FILE"
if [ ! -s "$TMP_FILE" ]; then
  echo "❌ 下载失败，请检查网络连接"; exit 1
fi
mkdir -p "$TMP_EXTRACT"
tar xzf "$TMP_FILE" -C "$TMP_EXTRACT" --strip-components=1
rm -rf "$INSTALL_DIR"/* "$INSTALL_DIR"/.[!.]* "$INSTALL_DIR"/..?* 2>/dev/null || true
cp -R "$TMP_EXTRACT"/. "$INSTALL_DIR"/
echo "  安装到 $INSTALL_DIR"

# ── 安装依赖并构建 ──
echo "[4/5] 安装依赖..."
cd "$INSTALL_DIR"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[5/5] 构建前端..."
npm run build

echo ""
echo "  ==============================="
echo "  ClawPanel Web 版部署完成！"
echo "  ==============================="
echo ""
echo "  版本:  $VERSION_LABEL"
echo "  目录:  $INSTALL_DIR"
echo "  启动:  cd $INSTALL_DIR && npm run serve -- --port $PORT"
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$IP" ]; then
  IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
fi
if [ -z "$IP" ]; then
  IP="localhost"
fi
echo "  访问:  http://$IP:$PORT"
echo ""
echo "  提示: 需要本地 OpenClaw Gateway 运行中（默认端口 18789）"
echo "        安装: npm i -g @qingchencloud/openclaw-zh"
echo "        启动: openclaw gateway start"
echo ""
