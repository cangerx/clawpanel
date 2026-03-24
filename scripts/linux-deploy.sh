#!/bin/bash
# 兼容入口：统一转发到仓库根目录 deploy.sh
# 支持本地仓库执行，也支持 curl | bash 直接运行此脚本

set -euo pipefail

LOCAL_ROOT=''
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  CANDIDATE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
  if [ -f "$CANDIDATE_ROOT/deploy.sh" ]; then
    LOCAL_ROOT="$CANDIDATE_ROOT/deploy.sh"
  fi
fi

if [ -n "$LOCAL_ROOT" ]; then
  exec bash "$LOCAL_ROOT" "$@"
fi

GITHUB_DEPLOY_URL="https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh"
GITEE_DEPLOY_URL="https://gitee.com/cangerx/clawpanel/raw/main/deploy.sh"

if command -v curl >/dev/null 2>&1; then
  tmp_script=$(mktemp /tmp/clawpanel-deploy-XXXXXX.sh)
  if curl -fsSL "$GITHUB_DEPLOY_URL" -o "$tmp_script"; then
    exec bash "$tmp_script" "$@"
  fi
  curl -fsSL "$GITEE_DEPLOY_URL" -o "$tmp_script"
  exec bash "$tmp_script" "$@"
fi

if command -v wget >/dev/null 2>&1; then
  tmp_script=$(mktemp /tmp/clawpanel-deploy-XXXXXX.sh)
  if wget -qO "$tmp_script" "$GITHUB_DEPLOY_URL"; then
    exec bash "$tmp_script" "$@"
  fi
  wget -qO "$tmp_script" "$GITEE_DEPLOY_URL"
  exec bash "$tmp_script" "$@"
fi

echo "Error: neither curl nor wget is available, and local deploy.sh was not found." >&2
exit 1
