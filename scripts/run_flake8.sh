#!/usr/bin/env bash

set -euo pipefail

# Determine repo root (parent of scripts dir)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Fail if flake8 is missing
command -v flake8 >/dev/null 2>&1 || { echo "flake8 not found. Install with: pip install flake8"; exit 127; }

# Run flake8 with local config and show which paths are excluded
echo "Running flake8 in $REPO_ROOT with config $REPO_ROOT/.flake8"
exec flake8 "$REPO_ROOT" --config "$REPO_ROOT/scripts/.flake8"
