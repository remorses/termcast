# termcast Monorepo

## Submodules

The following folders are git submodules:

- `tuistory/` - Package for testing TUI interfaces
- `ghostty-opentui/` - Zig/Ghostty terminal emulation library

## Submodule Detached HEAD Issue

Git submodules frequently end up in a "detached HEAD" state. This happens because:

1. **Submodules track commits, not branches** - The parent repo stores a specific commit SHA, not a branch name like "main"
2. **`git submodule update` checks out commits** - Running `git submodule update` or cloning with `--recurse-submodules` checks out that specific SHA, putting you in detached HEAD
3. **No branch tracking by default** - `.gitmodules` doesn't specify a branch to follow

### Fixing detached HEAD while keeping changes

If you made commits on the detached HEAD:

```bash
cd <submodule>
git checkout main
git cherry-pick <commit-sha>...  # cherry-pick your commits onto main
```

Or if no divergence from main:

```bash
cd <submodule>
git checkout main
```

### Prevention

After any submodule update, cd into submodules and run `git checkout main` before making changes.

## Submodule Rules

- Submodules should always stay on branch `main`, never detached
- Do not commit submodule changes unless explicitly asked
- Each submodule has its own AGENTS.md with package-specific guidelines
