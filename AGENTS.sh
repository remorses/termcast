#!/bin/bash

PREFIX="
# Project Coding Guidelines

NOTICE: AGENTS.md is generated using AGENTS.sh and should NEVER be manually updated.

---


"

OUTPUT_FILE="AGENTS.md"

echo "$PREFIX" > "$OUTPUT_FILE"

# shellcheck disable=SC2016
for f in $(cat <<EOF
core.md
typescript.md
# pnpm.md
gitchamber.md
react.md
sentry.md
vitest.md
changelog.md
docs-writing.md
doppler.md
cac.md
# prisma.md
# react-router.md
shadcn.md
tailwind.md
lucide.md
spiceflow.md
vercel-ai-sdk.md
# playwright.md
zod.md
EOF
); do
  # Keep commented filenames out of the process but list them for clarity
  if [[ $f =~ ^# ]]; then
    continue
  fi
  echo "Fetching $f..."
  curl -fsSL "https://raw.githubusercontent.com/remorses/AGENTS.md/main/$f" >> "$OUTPUT_FILE"
  printf '\n\n---\n\n' >> "$OUTPUT_FILE"
done

ln -sf AGENTS.md CLAUDE.md

echo "✅ AGENTS.md generated successfully!"
