#!/bin/bash

OUTPUT_FILE="AGENTS.md"

# Read prefix content from PREFIX.md instead of assigning to $PREFIX variable
cat PREFIX.md > "$OUTPUT_FILE"

# Force cache refresh with initial files listing
echo "Refreshing gitchamber cache..."
curl -fsSL "https://gitchamber.com/repos/remorses/AGENTS.md/main/files?force=true" > /dev/null

for f in \
    core.md \
    typescript.md \
    github.md \
    react.md \
    vitest.md \
    changelog.md \
    docs-writing.md \
    doppler.md \
    cac.md \
    prisma.md \
    zod.md; do
  echo "Fetching $f..."
  curl -fsSL "https://gitchamber.com/repos/remorses/AGENTS.md/main/files/$f" >> "$OUTPUT_FILE"
  printf '\n\n---\n\n' >> "$OUTPUT_FILE"
done

ln -sf AGENTS.md CLAUDE.md

echo "✅ AGENTS.md generated successfully!"
