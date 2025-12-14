#!/usr/bin/env bash

set -euo pipefail

# Determine repo root (parent of scripts dir)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Fail if bandit is missing
command -v bandit >/dev/null 2>&1 || { echo "bandit not found. Install with: pip install bandit"; exit 127; }

# Default target path is repo root; allow passing a path as first arg
TARGET_PATH="${1:-$REPO_ROOT}"

# Bandit: security linter for Python; exclude non-Python dirs explicitly
# Dynamically find all __pycache__ directories to exclude
EXCLUDE_PATHS="$REPO_ROOT/src/front,$REPO_ROOT/Szkice,$REPO_ROOT/logs,$REPO_ROOT/.venv"
PYCACHE_DIRS=$(find "$TARGET_PATH" -type d -name __pycache__ | paste -sd, -)
if [[ -n "$PYCACHE_DIRS" ]]; then
  EXCLUDE_PATHS="$EXCLUDE_PATHS,$PYCACHE_DIRS"
fi
exec bandit -r "$TARGET_PATH" \
  -x "$EXCLUDE_PATHS" \
  -lll

