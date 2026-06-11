#!/bin/bash
# Installs repo git hooks. Run once after cloning: ./scripts/install-hooks.sh
set -e
cd "$(dirname "$0")/.."
cp scripts/pre-commit-docs-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "Installed pre-commit hook (docs/brainstorms <-> docs/TODO.md coupling)."
