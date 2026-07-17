---
name: detect-upstream-base
description: >-
  Detect the upstream shuuul/obsidian-pivi tag
  (v1) that the current branch is based on. Ensures the upstream remote is
  configured, fetches tags, and finds the nearest upstream tag reachable from
  the fork point. Use when you need to identify the upstream base version of
  the current branch, or when another skill needs v1 detection.
---

# Detect Upstream Base Tag

Determine which upstream shuuul/obsidian-pivi tag
the current branch is forked from. Uses the shared **v1** notation (the
upstream tag the branch is currently based on).

## Step 1: Ensure upstream remote

```bash
if ! git remote get-url upstream &>/dev/null; then
  git remote add upstream https://github.com/shuuul/obsidian-pivi.git
fi
git fetch upstream --tags
```

## Step 2: Detect v1

```bash
V1_BASE=$(git merge-base HEAD upstream/main)
V1=$(git describe --tags --abbrev=0 --match="[0-9]*" "$V1_BASE" 2>/dev/null)
```

If `git describe` fails (no reachable tag matching `[0-9]*`),
fall back to the merge-base SHA:
```bash
V1=${V1:-$V1_BASE}
```

## Step 3: Confirm with user

Present to user: "The current upstream base tag appears to be **$V1**. Is
this correct, or would you like to specify a different tag?"

Wait for explicit confirmation before returning the value.

## Output

The confirmed value of **V1** (an upstream tag like `0.7.0`
or a commit SHA).
