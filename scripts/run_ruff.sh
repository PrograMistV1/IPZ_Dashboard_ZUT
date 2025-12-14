#!/usr/bin/env bash

set -euo pipefail

# Determine repo root (parent of scripts dir)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Fail if ruff is missing
command -v ruff >/dev/null 2>&1 || { echo "ruff not found. Install with: pip install ruff"; exit 127; }

# Default target path is repo root; allow passing a path as first arg
TARGET_PATH="${1:-$REPO_ROOT}"

# Ruff config discovery: prefers pyproject.toml; fallback to CLI options.
# Explicitly exclude non-Python and build dirs
exec ruff check "$TARGET_PATH" \
  --exclude "$REPO_ROOT/src/front" \
  --exclude "$REPO_ROOT/Szkice" \
  --exclude "$REPO_ROOT/logs" \
  --exclude "$REPO_ROOT/**/__pycache__" \
  --line-length 120

