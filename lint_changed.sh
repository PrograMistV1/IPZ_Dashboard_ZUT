#!/bin/bash

# shellcheck disable=SC2155
export PYTHONPATH=$(pwd)

CHANGED_FILES=$(git diff --name-only --diff-filter=ACM HEAD | grep '\.py$'; git diff --name-only --diff-filter=ACM --cached | grep '\.py$') || true

if [ -n "$CHANGED_FILES" ]; then
    echo "Checking changed files:"
    echo "$CHANGED_FILES"

    FILE_ARRAY=()
    while IFS= read -r line; do
        FILE_ARRAY+=("$line")
    done <<< "$CHANGED_FILES"

    pylint "${FILE_ARRAY[@]}" --rcfile=.github/workflows/.pylintrc --fail-under=7
else
    echo "No Python files changed."
fi
