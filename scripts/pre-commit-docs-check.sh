#!/bin/bash
# Pre-commit hook: keeps the idea backlog honest.
# Adding or removing a brainstorm doc must come with a docs/TODO.md update in the
# same commit (new idea -> TODO entry; shipped/dropped idea -> entry removed/updated).
# Install: ./scripts/install-hooks.sh
# Adapted from discipline-app's roadmap-coupling check (2026-06-11).

BRAINSTORM_TOUCHED=$(git diff --cached --name-only --diff-filter=ADR | grep -E "^docs/brainstorms/.*\.md$" || true)
TODO_STAGED=$(git diff --cached --name-only | grep -c "^docs/TODO\.md$" || true)

if [ -n "$BRAINSTORM_TOUCHED" ] && [ "$TODO_STAGED" = "0" ]; then
  echo ""
  echo "DOCS CHECK FAILED"
  echo "  You added/removed a brainstorm doc without updating docs/TODO.md:"
  echo "$BRAINSTORM_TOUCHED" | sed 's/^/    /'
  echo "  New idea  -> add it to docs/TODO.md"
  echo "  Shipped   -> mark it done / remove it from docs/TODO.md"
  echo "  (skip: git commit --no-verify)"
  echo ""
  exit 1
fi

exit 0
