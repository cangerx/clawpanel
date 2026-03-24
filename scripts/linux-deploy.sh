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

DEPLOY_URL="https://raw.githubusercontent.com/cangerx/clawpanel/main/deploy.sh"

if command -v curl >/dev/null 2>&1; then
  exec bash <(curl -fsSL "$DEPLOY_URL") "$@"
fi

if command -v wget >/dev/null 2>&1; then
  exec bash <(wget -qO- "$DEPLOY_URL") "$@"
fi

echo "Error: neither curl nor wget is available, and local deploy.sh was not found." >&2
exit 1
