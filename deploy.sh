#!/bin/bash
# ClawPanel Linux / Web 统一安装脚本
# 推荐入口:
#   海外用户（GitHub）: curl -fsSL https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh | bash
#   国内用户（Gitee）:  curl -fsSL https://gitee.com/cangerx/clawpanel/raw/main/deploy.sh | bash

set -euo pipefail

REPO="cangerx/clawpanel"
GITHUB_REPO_URL="https://github.com/$REPO"
GITEE_REPO_URL="https://gitee.com/$REPO"
GITHUB_RAW_BASE="https://raw.githubusercontent.com/cangerx/clawpanel"
GITEE_RAW_BASE="https://gitee.com/cangerx/clawpanel/raw"
GITHUB_ARCHIVE_BASE="https://github.com/$REPO/archive/refs"
GITEE_ARCHIVE_BASE="https://gitee.com/$REPO/repository/archive"
SERVICE_NAME="clawpanel"
REF="${CLAWPANEL_REF:-main}"
PORT="${CLAWPANEL_PORT:-1420}"
HOST="${CLAWPANEL_HOST:-0.0.0.0}"
DOWNLOAD_TIMEOUT="${CLAWPANEL_DOWNLOAD_TIMEOUT:-600}"
INSTALLER_VERSION="v4"

UNAME_S="$(uname -s 2>/dev/null || printf 'unknown')"
IS_LINUX=false
IS_ROOT=false
[ "$UNAME_S" = "Linux" ] && IS_LINUX=true
[ "$(id -u)" -eq 0 ] && IS_ROOT=true

if [ -n "${CLAWPANEL_DIR:-}" ]; then
  DEFAULT_INSTALL_DIR="$CLAWPANEL_DIR"
elif [ "$IS_LINUX" = true ] && [ "$IS_ROOT" = true ]; then
  DEFAULT_INSTALL_DIR="/opt/clawpanel"
elif [ "$IS_LINUX" = true ]; then
  DEFAULT_INSTALL_DIR="$HOME/.local/share/clawpanel"
else
  DEFAULT_INSTALL_DIR="$HOME/.clawpanel-web"
fi

INSTALL_DIR="$DEFAULT_INSTALL_DIR"
case "$INSTALL_DIR" in
  /*) ;;
  *) INSTALL_DIR="$(pwd)/$INSTALL_DIR" ;;
esac

RUN_DIR="${CLAWPANEL_RUN_DIR:-$INSTALL_DIR/.run}"
case "$RUN_DIR" in
  /*) ;;
  *) RUN_DIR="$(pwd)/$RUN_DIR" ;;
esac

PID_FILE="$RUN_DIR/${SERVICE_NAME}.pid"
LOG_FILE="$RUN_DIR/${SERVICE_NAME}.log"

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

TOTAL_STEPS=6
STEP=0
TMP_DIR=''
DOWNLOAD_URL=''
DOWNLOAD_URL_ALT=''
VERSION_LABEL=''
NODE_BIN=''
SERVICE_PATH=''
SERVICE_MODE='manual'
SERVICE_UNIT_FILE=''
STATUS_CMD=''
LOG_CMD=''
STOP_CMD=''
MANUAL_START_CMD=''
MODE_LABEL='手动启动'
SERVICE_NOTE=''

cleanup() {
  [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ] && rm -rf "$TMP_DIR"
}
trap cleanup EXIT

print_banner() {
  printf "\n"
  printf "%b╔══════════════════════════════════════════════════════════════╗%b\n" "$C_BLUE" "$C_RESET"
  printf "%b║%b %-60s %b║%b\n" "$C_BLUE" "$C_RESET" "${C_BOLD}ClawPanel Web Installer ${INSTALLER_VERSION}${C_RESET}" "$C_BLUE" "$C_RESET"
  printf "%b║%b %-78s%b║%b\n" "$C_BLUE" "$C_RESET" "统一安装 · 自动构建 · 后台服务自动托管" "$C_BLUE" "$C_RESET"
  printf "%b║%b %-78s%b║%b\n" "$C_BLUE" "$C_RESET" "优先 systemd，失败时回退 nohup，最终兜底手动启动" "$C_BLUE" "$C_RESET"
  printf "%b╚══════════════════════════════════════════════════════════════╝%b\n" "$C_BLUE" "$C_RESET"
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

clear_line() {
  printf '\r\033[2K'
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1
}

file_size() {
  local path="$1"
  if [ ! -f "$path" ]; then
    printf '0'
    return
  fi

  stat -f%z "$path" 2>/dev/null || stat -c%s "$path" 2>/dev/null || printf '0'
}

format_bytes() {
  local bytes="${1:-0}"
  if [ "$bytes" -ge 1073741824 ]; then
    printf '%dGB' $((bytes / 1073741824))
  elif [ "$bytes" -ge 1048576 ]; then
    printf '%dMB' $((bytes / 1048576))
  elif [ "$bytes" -ge 1024 ]; then
    printf '%dKB' $((bytes / 1024))
  else
    printf '%dB' "$bytes"
  fi
}

probe_content_length() {
  local url="$1"
  local content_length=''

  if require_cmd curl; then
    content_length=$(curl --fail --location --silent --show-error --head \
      --connect-timeout 15 --max-time 30 "$url" 2>/dev/null | \
      awk 'tolower($1) == "content-length:" { gsub("\r", "", $2); value=$2 } END { print value }') || true
  elif require_cmd wget; then
    content_length=$(wget --server-response --spider "$url" 2>&1 | \
      awk 'tolower($1) == "content-length:" { gsub("\r", "", $2); value=$2 } END { print value }') || true
  fi

  case "$content_length" in
    ''|*[!0-9]*) printf '0' ;;
    *) printf '%s' "$content_length" ;;
  esac
}

download_with_live_progress() {
  local url="$1"
  local output="$2"
  local total_bytes downloaded downloaded_text total_text speed_bytes speed_text percent elapsed status
  local start_time pid

  total_bytes=$(probe_content_length "$url")
  start_time=$(date +%s)

  if require_cmd curl; then
    curl --fail --location --silent --show-error \
      --connect-timeout 15 --max-time "$DOWNLOAD_TIMEOUT" \
      --retry 2 --retry-delay 2 \
      -o "$output" "$url" &
  elif require_cmd wget; then
    wget --tries=3 --timeout=15 -q -O "$output" "$url" &
  else
    return 1
  fi

  pid=$!

  while kill -0 "$pid" 2>/dev/null; do
    downloaded=$(file_size "$output")
    elapsed=$(( $(date +%s) - start_time ))
    if [ "$elapsed" -lt 1 ]; then
      elapsed=1
    fi

    speed_bytes=$(( downloaded / elapsed ))
    downloaded_text=$(format_bytes "$downloaded")
    speed_text=$(format_bytes "$speed_bytes")

    if [ "$total_bytes" -gt 0 ]; then
      percent=$(( downloaded * 100 / total_bytes ))
      if [ "$percent" -gt 100 ]; then
        percent=100
      fi
      total_text=$(format_bytes "$total_bytes")
      printf "\r  %b↓%b 下载中 %3d%%  %s / %s  %s/s" "$C_CYAN" "$C_RESET" "$percent" "$downloaded_text" "$total_text" "$speed_text"
    else
      printf "\r  %b↓%b 下载中      %s  %s/s" "$C_CYAN" "$C_RESET" "$downloaded_text" "$speed_text"
    fi

    sleep 0.2
  done

  wait "$pid"
  status=$?
  clear_line

  if [ "$status" -eq 0 ]; then
    downloaded=$(file_size "$output")
    downloaded_text=$(format_bytes "$downloaded")
    if [ "$total_bytes" -gt 0 ]; then
      total_text=$(format_bytes "$total_bytes")
      log_ok "源码下载完成 (${downloaded_text} / ${total_text})"
    else
      log_ok "源码下载完成 (${downloaded_text})"
    fi
  fi

  return "$status"
}

run_with_spinner() {
  local label="$1"
  shift

  if [ ! -t 1 ]; then
    "$@"
    return
  fi

  local log_file pid status i
  local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  log_file=$(mktemp /tmp/clawpanel-task-XXXXXX.log)

  "$@" >"$log_file" 2>&1 &
  pid=$!
  i=0

  while kill -0 "$pid" 2>/dev/null; do
    printf "\r  %b%s%b %s" "$C_CYAN" "${frames[$i]}" "$C_RESET" "$label"
    i=$(((i + 1) % ${#frames[@]}))
    sleep 0.1
  done

  wait "$pid"
  status=$?
  clear_line

  if [ "$status" -eq 0 ]; then
    log_ok "$label"
  else
    log_error "$label"
    if [ -s "$log_file" ]; then
      printf "%b──────────────── 任务输出 ────────────────%b\n" "$C_RED" "$C_RESET" >&2
      cat "$log_file" >&2
      printf "%b──────────────────────────────────────────%b\n" "$C_RED" "$C_RESET" >&2
    fi
    rm -f "$log_file"
    return "$status"
  fi

  rm -f "$log_file"
}

validate_runtime_inputs() {
  case "$PORT" in
    ''|*[!0-9]*)
      log_error "CLAWPANEL_PORT 必须是 1-65535 的整数"
      exit 1
      ;;
  esac

  if [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    log_error "CLAWPANEL_PORT 必须是 1-65535 的整数"
    exit 1
  fi

  case "$INSTALL_DIR" in
    ''|'/')
      log_error "安装目录不合法：$INSTALL_DIR"
      exit 1
      ;;
  esac
}

detect_ip() {
  local ip=""
  ip=$(hostname -I 2>/dev/null | awk '{print $1}') || true
  if [ -z "$ip" ] && require_cmd ip; then
    ip=$(ip route get 1 2>/dev/null | awk '/src/ { for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }') || true
  fi
  if [ -z "$ip" ] && require_cmd ipconfig; then
    ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
  fi
  if [ -z "$ip" ]; then
    ip="localhost"
  fi
  printf '%s' "$ip"
}

resolve_target() {
  if [ "$REF" = "main" ]; then
    DOWNLOAD_URL="$GITHUB_ARCHIVE_BASE/heads/main.tar.gz"
    DOWNLOAD_URL_ALT="$GITEE_ARCHIVE_BASE?ref=main&format=tgz"
    VERSION_LABEL="main"
  else
    DOWNLOAD_URL="$GITHUB_ARCHIVE_BASE/tags/$REF.tar.gz"
    DOWNLOAD_URL_ALT="$GITEE_ARCHIVE_BASE?ref=$REF&format=tgz"
    VERSION_LABEL="$REF"
  fi

  log_info "安装目标: $VERSION_LABEL"
  log_info "安装目录: $INSTALL_DIR"
  log_info "监听地址: $HOST:$PORT"
}

download_archive() {
  local url="$1"
  local output="$2"

  if [ -t 1 ]; then
    download_with_live_progress "$url" "$output"
    return
  fi

  if require_cmd curl; then
    curl --fail --location --silent --show-error \
      --connect-timeout 15 --max-time "$DOWNLOAD_TIMEOUT" \
      --retry 2 --retry-delay 2 \
      -o "$output" "$url"
    return
  fi

  if require_cmd wget; then
    wget --tries=3 --timeout=15 -q -O "$output" "$url"
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
    log_ok "源码包下载并解压完成（GitHub）"
    return 0
  fi

  if [ -n "$DOWNLOAD_URL_ALT" ]; then
    log_warn "GitHub 源码包下载失败，尝试使用 Gitee 镜像"
    rm -f "$tmp_file"
    if download_archive "$DOWNLOAD_URL_ALT" "$tmp_file"; then
      [ -s "$tmp_file" ] || return 1
      mkdir -p "$tmp_extract"
      tar xzf "$tmp_file" -C "$tmp_extract" --strip-components=1
      log_ok "源码包下载并解压完成（Gitee）"
      return 0
    fi
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
    if git clone --depth 1 "$GITHUB_REPO_URL.git" "$tmp_extract"; then
      log_ok "git clone 回退成功（GitHub）"
      return 0
    fi
    log_warn "GitHub clone 失败，尝试使用 Gitee 镜像"
    git clone --depth 1 "$GITEE_REPO_URL.git" "$tmp_extract"
    log_ok "git clone 回退成功（Gitee）"
    return 0
  fi

  if git clone --depth 1 --branch "$REF" "$GITHUB_REPO_URL.git" "$tmp_extract"; then
    log_ok "git clone 回退成功（GitHub）"
    return 0
  fi

  log_warn "GitHub clone 失败，尝试使用 Gitee 镜像"
  git clone --depth 1 --branch "$REF" "$GITEE_REPO_URL.git" "$tmp_extract"
  log_ok "git clone 回退成功（Gitee）"
}

stop_existing_nohup_runtime() {
  local pid cmd

  [ -f "$PID_FILE" ] || return 0

  pid=$(tr -cd '0-9' < "$PID_FILE")
  if [ -z "$pid" ]; then
    rm -f "$PID_FILE"
    return 0
  fi

  if ! kill -0 "$pid" 2>/dev/null; then
    rm -f "$PID_FILE"
    return 0
  fi

  cmd=$(ps -p "$pid" -o command= 2>/dev/null || true)
  case "$cmd" in
    *"$INSTALL_DIR/scripts/serve.js"*|*"scripts/serve.js --host $HOST --port $PORT"*)
      log_info "检测到已有 nohup 后台实例，准备替换"
      kill "$pid" 2>/dev/null || true
      for _ in 1 2 3 4 5; do
        if ! kill -0 "$pid" 2>/dev/null; then
          break
        fi
        sleep 0.2
      done
      if kill -0 "$pid" 2>/dev/null; then
        log_error "旧的 nohup 实例仍在运行，请先手动停止后重试"
        return 1
      fi
      rm -f "$PID_FILE"
      log_ok "旧的 nohup 实例已停止"
      ;;
    *)
      log_warn "检测到 PID 文件存在但进程不匹配，已忽略该 PID 文件"
      rm -f "$PID_FILE"
      ;;
  esac
}

stop_existing_systemd_runtime() {
  if can_use_systemd_system; then
    if systemctl list-unit-files | awk '{print $1}' | grep -Fxq "${SERVICE_NAME}.service"; then
      if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
        log_info "检测到已有 systemd 服务实例，准备更新"
        systemctl stop "${SERVICE_NAME}.service"
        log_ok "已停止旧的 systemd 服务实例"
      fi
    fi
    return 0
  fi

  if can_use_systemd_user; then
    if systemctl --user list-unit-files | awk '{print $1}' | grep -Fxq "${SERVICE_NAME}.service"; then
      if systemctl --user is-active --quiet "${SERVICE_NAME}.service"; then
        log_info "检测到已有 systemd --user 服务实例，准备更新"
        systemctl --user stop "${SERVICE_NAME}.service"
        log_ok "已停止旧的 systemd --user 服务实例"
      fi
    fi
  fi
}

stop_existing_runtime() {
  stop_existing_systemd_runtime
  stop_existing_nohup_runtime
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
    run_with_spinner "安装 npm 依赖中" npm ci
  else
    log_info "未检测到 package-lock.json，使用 npm install"
    run_with_spinner "安装 npm 依赖中" npm install
  fi
}

prepare_user_systemd_env() {
  if [ -z "${XDG_RUNTIME_DIR:-}" ] && [ -d "/run/user/$(id -u)" ]; then
    export XDG_RUNTIME_DIR="/run/user/$(id -u)"
  fi

  if [ -n "${XDG_RUNTIME_DIR:-}" ] && [ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ] && [ -S "$XDG_RUNTIME_DIR/bus" ]; then
    export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
  fi
}

can_use_systemd_system() {
  [ "$IS_LINUX" = true ] || return 1
  [ "$IS_ROOT" = true ] || return 1
  require_cmd systemctl || return 1
  [ -d /run/systemd/system ] || return 1
  systemctl list-unit-files >/dev/null 2>&1
}

can_use_systemd_user() {
  [ "$IS_LINUX" = true ] || return 1
  [ "$IS_ROOT" = false ] || return 1
  require_cmd systemctl || return 1
  [ -d /run/systemd/system ] || return 1
  prepare_user_systemd_env
  systemctl --user list-unit-files >/dev/null 2>&1
}

write_systemd_unit() {
  local unit_path="$1"
  local wanted_by="$2"

  mkdir -p "$(dirname "$unit_path")"
  cat > "$unit_path" <<EOF
[Unit]
Description=ClawPanel Web
After=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
ExecStart=$NODE_BIN $INSTALL_DIR/scripts/serve.js --host $HOST --port $PORT
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=HOME=$HOME
Environment=PATH=$SERVICE_PATH

[Install]
WantedBy=$wanted_by
EOF
}

setup_systemd_service() {
  local ctl_cmd scope wanted_by

  if [ "$IS_ROOT" = true ]; then
    scope="systemd"
    ctl_cmd="systemctl"
    wanted_by="multi-user.target"
    SERVICE_UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
  else
    scope="systemd --user"
    ctl_cmd="systemctl --user"
    wanted_by="default.target"
    SERVICE_UNIT_FILE="$HOME/.config/systemd/user/${SERVICE_NAME}.service"
    loginctl enable-linger "$(id -un)" >/dev/null 2>&1 || true
  fi

  write_systemd_unit "$SERVICE_UNIT_FILE" "$wanted_by"
  log_ok "服务文件已写入: $SERVICE_UNIT_FILE"

  if [ "$IS_ROOT" = true ]; then
    systemctl daemon-reload
    systemctl enable "${SERVICE_NAME}.service" >/dev/null
    if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
      systemctl restart "${SERVICE_NAME}.service"
    else
      systemctl start "${SERVICE_NAME}.service"
    fi
    STATUS_CMD="systemctl status ${SERVICE_NAME}"
    LOG_CMD="journalctl -u ${SERVICE_NAME} -f"
    STOP_CMD="systemctl stop ${SERVICE_NAME}"
  else
    prepare_user_systemd_env
    systemctl --user daemon-reload
    systemctl --user enable "${SERVICE_NAME}.service" >/dev/null
    if systemctl --user is-active --quiet "${SERVICE_NAME}.service"; then
      systemctl --user restart "${SERVICE_NAME}.service"
    else
      systemctl --user start "${SERVICE_NAME}.service"
    fi
    STATUS_CMD="systemctl --user status ${SERVICE_NAME}"
    LOG_CMD="journalctl --user -u ${SERVICE_NAME} -f"
    STOP_CMD="systemctl --user stop ${SERVICE_NAME}"
  fi

  SERVICE_MODE="$scope"
  MODE_LABEL="$scope"
  log_ok "已通过 $scope 启动并设置开机自启"
}

setup_nohup_service() {
  local pid

  mkdir -p "$RUN_DIR"
  stop_existing_nohup_runtime || return 1
  : > "$LOG_FILE"

  nohup env NODE_ENV=production HOME="$HOME" PATH="$SERVICE_PATH" \
    "$NODE_BIN" "$INSTALL_DIR/scripts/serve.js" --host "$HOST" --port "$PORT" \
    >>"$LOG_FILE" 2>&1 &
  pid=$!
  printf '%s\n' "$pid" > "$PID_FILE"

  sleep 0.5
  if ! kill -0 "$pid" 2>/dev/null; then
    log_error "nohup 后台启动失败，请检查日志: $LOG_FILE"
    return 1
  fi

  SERVICE_MODE='nohup'
  MODE_LABEL='nohup'
  SERVICE_UNIT_FILE=''
  printf -v STATUS_CMD 'ps -p "$(cat %q)" -o pid=,etime=,command=' "$PID_FILE"
  printf -v LOG_CMD 'tail -f %q' "$LOG_FILE"
  printf -v STOP_CMD 'kill "$(cat %q)"' "$PID_FILE"
  log_ok "已使用 nohup 在后台启动"
}

set_manual_fallback() {
  SERVICE_MODE='manual'
  MODE_LABEL='手动启动'
  SERVICE_UNIT_FILE=''
  STATUS_CMD=''
  LOG_CMD=''
  STOP_CMD=''
  printf -v MANUAL_START_CMD 'cd %q && npm run serve -- --host %q --port %q' "$INSTALL_DIR" "$HOST" "$PORT"
}

setup_runtime() {
  printf -v MANUAL_START_CMD 'cd %q && npm run serve -- --host %q --port %q' "$INSTALL_DIR" "$HOST" "$PORT"

  if can_use_systemd_system; then
    log_info "检测到 Linux + systemd，使用系统服务模式"
    if setup_systemd_service; then
      return 0
    fi
    SERVICE_NOTE='systemd 启动失败，已尝试回退到 nohup。'
    log_warn "$SERVICE_NOTE"
  elif can_use_systemd_user; then
    log_info "检测到 Linux + systemd，使用用户服务模式"
    if setup_systemd_service; then
      return 0
    fi
    SERVICE_NOTE='systemd --user 启动失败，已尝试回退到 nohup。'
    log_warn "$SERVICE_NOTE"
  fi

  if require_cmd nohup; then
    log_info "当前环境不适合使用 systemd，回退到 nohup 后台运行"
    if setup_nohup_service; then
      return 0
    fi
    SERVICE_NOTE='nohup 后台启动失败，请使用手动命令启动。'
    log_warn "$SERVICE_NOTE"
  fi

  set_manual_fallback
  if [ -z "$SERVICE_NOTE" ]; then
    SERVICE_NOTE='当前环境不支持自动后台托管，请使用手动命令启动。'
  fi
  log_warn "$SERVICE_NOTE"
}

print_done() {
  local ip
  ip=$(detect_ip)

  printf "\n"
  printf "%b╔══════════════════════════════════════════════════════════════╗%b\n" "$C_GREEN" "$C_RESET"
  printf "%b║%b %-60s %b║%b\n" "$C_GREEN" "$C_RESET" "${C_BOLD}ClawPanel 部署完成${C_RESET}" "$C_GREEN" "$C_RESET"
  printf "%b╚══════════════════════════════════════════════════════════════╝%b\n" "$C_GREEN" "$C_RESET"
  printf "\n"
  printf "  %b版本/ref%b   %s\n" "$C_DIM" "$C_RESET" "$VERSION_LABEL"
  printf "  %b安装目录%b   %s\n" "$C_DIM" "$C_RESET" "$INSTALL_DIR"
  printf "  %b运行模式%b   %s\n" "$C_DIM" "$C_RESET" "$MODE_LABEL"

  if [ "$HOST" = "0.0.0.0" ]; then
    printf "  %b访问地址%b   http://localhost:%s\n" "$C_DIM" "$C_RESET" "$PORT"
    if [ "$ip" != "localhost" ]; then
      printf "             http://%s:%s\n" "$ip" "$PORT"
    fi
  else
    printf "  %b访问地址%b   http://%s:%s\n" "$C_DIM" "$C_RESET" "$HOST" "$PORT"
  fi

  if [ -n "$SERVICE_UNIT_FILE" ]; then
    printf "  %b服务文件%b   %s\n" "$C_DIM" "$C_RESET" "$SERVICE_UNIT_FILE"
  fi

  if [ -n "$STATUS_CMD" ]; then
    printf "  %b状态命令%b   %s\n" "$C_DIM" "$C_RESET" "$STATUS_CMD"
  fi
  if [ -n "$LOG_CMD" ]; then
    printf "  %b日志命令%b   %s\n" "$C_DIM" "$C_RESET" "$LOG_CMD"
  fi
  if [ -n "$STOP_CMD" ]; then
    printf "  %b停止命令%b   %s\n" "$C_DIM" "$C_RESET" "$STOP_CMD"
  fi
  if [ "$SERVICE_MODE" = 'manual' ]; then
    printf "  %b启动命令%b   %s\n" "$C_DIM" "$C_RESET" "$MANUAL_START_CMD"
  fi
  if [ -n "$SERVICE_NOTE" ]; then
    printf "  %b说明%b       %s\n" "$C_DIM" "$C_RESET" "$SERVICE_NOTE"
  fi

  printf "\n"
  printf "  %b提示%b       ClawPanel 需要本机 OpenClaw Gateway 配合使用（默认端口 18789）\n" "$C_DIM" "$C_RESET"
  printf "\n"
}

main() {
  print_banner

  log_step "检查运行环境"
  validate_runtime_inputs
  require_cmd node || { log_error "需要 Node.js 18+，请先安装: https://nodejs.org/"; exit 1; }
  require_cmd npm || { log_error "需要 npm，请先安装 Node.js/npm"; exit 1; }
  require_cmd tar || { log_error "需要 tar 命令用于解压源码包"; exit 1; }
  NODE_BIN="$(command -v node)"
  SERVICE_PATH="$(dirname "$NODE_BIN"):/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
  if [ "$(node -v | sed 's/^v//' | cut -d. -f1)" -lt 18 ]; then
    log_error "当前 Node.js 版本过低: $(node -v)，需要 18+"
    exit 1
  fi
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
  stop_existing_runtime || exit 1
  install_source "$TMP_EXTRACT"
  cd "$INSTALL_DIR"
  install_deps

  log_step "构建前端"
  run_with_spinner "构建前端产物中" npm run build
  log_ok "前端构建完成"

  log_step "配置后台服务"
  setup_runtime

  print_done
}

main "$@"
