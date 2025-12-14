#!/usr/bin/env bash

set -euo pipefail

# Determine repo root (parent of scripts dir)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Fail if flake8 is missing
command -v flake8 >/dev/null 2>&1 || { echo "flake8 not found. Install with: pip install flake8"; exit 127; }

# Run flake8
echo "Running flake8 in $REPO_ROOT with inline config"
exec flake8 "$REPO_ROOT/src" \
  --max-line-length 120 \
  --extend-exclude \
    ".git,__pycache__,.venv,venv,env,.mypy_cache,.ruff_cache,.pytest_cache,build,dist,node_modules,src/front,Szkice,logs"
