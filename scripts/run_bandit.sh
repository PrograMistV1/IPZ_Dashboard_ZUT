#!/usr/bin/env bash

set -euo pipefail

# Determine repo root (parent of scripts dir)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Fail if bandit is missing
command -v bandit >/dev/null 2>&1 || { echo "bandit not found. Install with: pip install bandit"; exit 127; }

# Default target path is repo root; allow passing a path as first arg
TARGET_PATH="${1:-$REPO_ROOT}"

# Bandit: security linter for Python; exclude non-Python dirs explicitly
exec bandit -r "$TARGET_PATH" \
  -x "$REPO_ROOT/src/front,$REPO_ROOT/Szkice,$REPO_ROOT/logs,$REPO_ROOT/**/__pycache__,$REPO_ROOT/.venv" \
  -lll

