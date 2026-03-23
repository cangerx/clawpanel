#!/bin/bash
# ClawPanel Web 版快速安装/更新脚本
# 适用于 macOS / Linux / WSL / Docker / 远程服务器
# 用法: curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash

set -euo pipefail

REPO="cangerx/clawpanel"
INSTALL_DIR="${CLAWPANEL_DIR:-$HOME/.clawpanel-web}"
PORT="${CLAWPANEL_PORT:-1420}"
REF="${CLAWPANEL_REF:-main}"
DOWNLOAD_TIMEOUT="${CLAWPANEL_DOWNLOAD_TIMEOUT:-600}"

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET='\033[0m'
  C_BOLD='\033[1m'
  C_DIM='\033[2m'
  C_BLUE='\033[38;5;75m'
  C_CYAN='\033[38;5;81m'
  C_GREEN='\033[38;5;42m'
  C_YELLOW='\033[38;5;220m'
  C_RED='\033[38;5;203m'
  C_PURPLE='\033[38;5;141m'
else
  C_RESET=''
  C_BOLD=''
  C_DIM=''
  C_BLUE=''
  C_CYAN=''
  C_GREEN=''
  C_YELLOW=''
  C_RED=''
  C_PURPLE=''
fi

TOTAL_STEPS=5
STEP=0
TMP_DIR=''
DOWNLOAD_URL=''
VERSION_LABEL=''

cleanup() {
  [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ] && rm -rf "$TMP_DIR"
}
trap cleanup EXIT

print_banner() {
  printf "\n"
  printf "%b╭──────────────────────────────────────────────╮%b\n" "$C_BLUE" "$C_RESET"
  printf "%b│%b %-44s %b│%b\n" "$C_BLUE" "$C_RESET" "${C_BOLD}ClawPanel Web 一键安装器${C_RESET}" "$C_BLUE" "$C_RESET"
  printf "%b│%b %-58s%b│%b\n" "$C_BLUE" "$C_RESET" "最新版拉取 · 自动构建 · 可重复执行更新" "$C_BLUE" "$C_RESET"
  printf "%b╰──────────────────────────────────────────────╯%b\n" "$C_BLUE" "$C_RESET"
  printf "\n"
}

log_step() {
  STEP=$((STEP + 1))
  printf "%b[%d/%d]%b %s\n" "$C_PURPLE$C_BOLD" "$STEP" "$TOTAL_STEPS" "$C_RESET" "$1"
}

log_info() {
  printf "  %b•%b %s\n" "$C_CYAN" "$C_RESET" "$1"
}

log_ok() {
  printf "  %b✔%b %s\n" "$C_GREEN" "$C_RESET" "$1"
}

log_warn() {
  printf "  %b!%b %s\n" "$C_YELLOW" "$C_RESET" "$1"
}

log_error() {
  printf "  %b✘%b %s\n" "$C_RED" "$C_RESET" "$1" >&2
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1
}

detect_ip() {
  local ip=""
  ip=$(hostname -I 2>/dev/null | awk '{print $1}') || true
  if [ -z "$ip" ] && require_cmd ipconfig; then
    ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
  fi
  if [ -z "$ip" ] && require_cmd hostname; then
    ip=$(hostname 2>/dev/null || true)
  fi
  if [ -z "$ip" ]; then
    ip="localhost"
  fi
  printf '%s' "$ip"
}

resolve_target() {
  if [ "$REF" = "main" ]; then
    DOWNLOAD_URL="https://github.com/$REPO/archive/refs/heads/main.tar.gz"
    VERSION_LABEL="main"
    log_info "安装目标: 最新主线 main"
  else
    DOWNLOAD_URL="https://github.com/$REPO/archive/refs/tags/$REF.tar.gz"
    VERSION_LABEL="$REF"
    log_info "安装目标: 指定版本 $REF"
  fi
  log_info "安装目录: $INSTALL_DIR"
  log_info "监听端口: $PORT"
}

download_archive() {
  local url="$1"
  local output="$2"

  if require_cmd curl; then
    if [ -t 1 ]; then
      curl --fail --location --progress-bar \
        --connect-timeout 15 --max-time "$DOWNLOAD_TIMEOUT" \
        --retry 2 --retry-delay 2 \
        -o "$output" "$url"
    else
      curl --fail --location --silent --show-error \
        --connect-timeout 15 --max-time "$DOWNLOAD_TIMEOUT" \
        --retry 2 --retry-delay 2 \
        -o "$output" "$url"
    fi
    return
  fi

  if require_cmd wget; then
    wget --tries=3 --timeout=15 --progress=bar:force:noscroll -O "$output" "$url"
    return
  fi

  return 1
}

fetch_source() {
  local tmp_file="$1"
  local tmp_extract="$2"

  if download_archive "$DOWNLOAD_URL" "$tmp_file"; then
    [ -s "$tmp_file" ] || return 1
    mkdir -p "$tmp_extract"
    tar xzf "$tmp_file" -C "$tmp_extract" --strip-components=1
    log_ok "源码包下载并解压完成"
    return 0
  fi

  return 1
}

clone_source_fallback() {
  local tmp_extract="$1"

  require_cmd git || {
    log_error "源码包下载失败，且系统未安装 git，无法回退 clone"
    return 1
  }

  log_warn "源码包下载失败，尝试使用 git clone 回退"
  rm -rf "$tmp_extract"

  if [ "$REF" = "main" ]; then
    git clone --depth 1 "https://github.com/$REPO.git" "$tmp_extract"
  else
    git clone --depth 1 --branch "$REF" "https://github.com/$REPO.git" "$tmp_extract"
  fi

  log_ok "git clone 回退成功"
}

install_source() {
  local tmp_extract="$1"
  mkdir -p "$INSTALL_DIR"
  rm -rf "$INSTALL_DIR"/* "$INSTALL_DIR"/.[!.]* "$INSTALL_DIR"/..?* 2>/dev/null || true
  cp -R "$tmp_extract"/. "$INSTALL_DIR"/
  log_ok "已安装到 $INSTALL_DIR"
}

install_deps() {
  if [ -f package-lock.json ]; then
    log_info "检测到 package-lock.json，使用 npm ci"
    npm ci
  else
    log_info "未检测到 package-lock.json，使用 npm install"
    npm install
  fi
}

print_done() {
  local ip
  ip=$(detect_ip)

  printf "\n"
  printf "%b╭──────────────────────────────────────────────╮%b\n" "$C_GREEN" "$C_RESET"
  printf "%b│%b %-44s %b│%b\n" "$C_GREEN" "$C_RESET" "${C_BOLD}部署完成${C_RESET}" "$C_GREEN" "$C_RESET"
  printf "%b╰──────────────────────────────────────────────╯%b\n" "$C_GREEN" "$C_RESET"
  printf "\n"
  printf "  %b版本%b  %s\n" "$C_DIM" "$C_RESET" "$VERSION_LABEL"
  printf "  %b目录%b  %s\n" "$C_DIM" "$C_RESET" "$INSTALL_DIR"
  printf "  %b访问%b  http://%s:%s\n" "$C_DIM" "$C_RESET" "$ip" "$PORT"
  printf "  %b启动%b  cd %s && npm run serve -- --port %s\n" "$C_DIM" "$C_RESET" "$INSTALL_DIR" "$PORT"
  printf "\n"
  printf "  %b提示%b  需要本地 OpenClaw Gateway 运行中（默认端口 18789）\n" "$C_DIM" "$C_RESET"
  printf "        安装: npm i -g @qingchencloud/openclaw-zh\n"
  printf "        启动: openclaw gateway start\n"
  printf "\n"
}

print_banner

log_step "检查运行环境"
require_cmd node || { log_error "需要 Node.js，请先安装: https://nodejs.org/"; exit 1; }
require_cmd npm || { log_error "需要 npm，请先安装 Node.js/npm"; exit 1; }
log_ok "node $(node -v) / npm $(npm -v)"

log_step "准备安装目标"
resolve_target

log_step "下载源码"
TMP_DIR=$(mktemp -d /tmp/clawpanel-XXXXXX)
TMP_FILE="$TMP_DIR/clawpanel.tar.gz"
TMP_EXTRACT="$TMP_DIR/extracted"
if ! fetch_source "$TMP_FILE" "$TMP_EXTRACT"; then
  clone_source_fallback "$TMP_EXTRACT"
fi

log_step "安装依赖"
install_source "$TMP_EXTRACT"
cd "$INSTALL_DIR"
install_deps

log_step "构建前端"
npm run build
log_ok "前端构建完成"

print_done
