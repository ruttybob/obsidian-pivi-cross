---
name: auto-cherry-pick
description: >-
  Automatically check for new upstream
  shuuul/obsidian-pivi releases and
  cherry-pick the fork's custom commits onto the latest one. Orchestrates
  detect-upstream-base and cherry-pick-assistant end-to-end. Use when the user
  asks to check for upstream updates, auto-cherry-pick to the latest
  release, or keep the fork up to date.
---

# Auto Cherry-Pick

Check whether a newer upstream
shuuul/obsidian-pivi release exists and, if so,
cherry-pick the fork's custom commits onto it automatically. Uses the same
notation as `cherry-pick-assistant`: **v1**/​**v2** for upstream tags, **b1**/​**b2**
for the branch before/after sync.

## Step 0: Prerequisites

`gh` provides release metadata (pre-release flags, release notes). Verify it is
authenticated; the git-tag fallback below works without it:

```bash
gh auth status 2>/dev/null || echo "NOTE: gh not authenticated (git-tag fallback will be used)"
```

If `gh auth status` fails, prompt the user to run `gh auth login` and wait for
confirmation before proceeding.

## Step 1: Detect Current Upstream Base

The current branch is **b1**. Use the `detect-upstream-base` skill to identify
**v1**. See [detect-upstream-base](../detect-upstream-base/SKILL.md).

Confirm v1 with the user before proceeding.

## Step 2: Check for New Upstream Releases

```bash
git fetch upstream --tags
```

List upstream release tags newer than v1:

```bash
git tag --list "[0-9]*" --sort=-version:refname \
  | while read -r tag; do
      git merge-base --is-ancestor "$V1" "$tag" 2>/dev/null \
        && [ "$tag" != "$V1" ] \
        && echo "$tag"
    done
```

Alternatively, use `gh` for a cleaner check with pre-release flags:

```bash
gh release list --repo shuuul/obsidian-pivi --limit 10 | awk '{print $1}'
```

Pick the **latest stable release** as the candidate **v2**. Skip pre-release or
release-candidate tags unless the user opts in.

Present to user:
- Current base: **v1**
- Latest upstream release: **v2**
- Release notes: `https://github.com/shuuul/obsidian-pivi/releases/tag/$V2`

If v1 == v2 (already up to date), report that and stop.

Ask: "A new release **$V2** is available. Proceed with cherry-pick?"

Wait for confirmation before proceeding.

## Step 3: Collect Sync Inputs

Before invoking `cherry-pick-assistant`, gather the remaining required inputs:

1. **Verification checks**: Ask the user which checks to run after sync.
   Default suggestions for this repo:

   - `npm run typecheck`
   - `npm run lint`
   - `npm run check:boundaries`
   - `npm run test:coverage`
   - `npm run build`

2. **Reference commit** (optional): a known-good commit where checks pass.
   Defaults to `HEAD` on **b1**.

## Step 4: Cherry-Pick

Invoke the `cherry-pick-assistant` skill with the collected inputs:
- **v1**: from Step 1
- **v2**: from Step 2
- **Verification checks**: from Step 3
- **Reference commit**: from Step 3 (if provided)

See [cherry-pick-assistant](../cherry-pick-assistant/SKILL.md).

Follow the full cherry-pick-assistant workflow (analyze **b1**, back it up,
create **b2**, replay onto v2, resolve conflicts, verify **b2**).

## Step 5: Summarize and Push

Once cherry-pick-assistant completes, present a final summary:

- **b1** (original branch): preserved as backup
- **b2** (synced branch): now based on v2
- **Previous base**: v1 → **New base**: v2
- **Custom commits replayed**: count and brief description
- **Conflicts resolved**: list of files and decisions (from cherry-pick-assistant)
- **Verification results**: pass/fail for each check, with log paths
- **Backup branch**: name for rollback to **b1** if needed

Then ask: "Push **b2** to origin?"

If yes:
```bash
git push origin HEAD
```

If the branch already exists on the remote and needs a force push:
```bash
git push origin HEAD --force-with-lease
```

Warn the user before force-pushing and wait for explicit confirmation.

## Step 6: Bump the version's upstream suffix

<!-- yapi-manual-edit: version-suffix-bump duty. Reconcile on builder --update. -->

On a successful sync to **v2**, the version's `-u<upstream>` suffix must mirror
the new upstream base, and the fork profile's `current_base_tag` must track it.
YaPi uses a manual `<yapi-core>-u<upstream>` version scheme (e.g.
`0.1.0-u0.7.0`); the `-u` suffix and `current_base_tag` are kept in sync here.

After **b2** verification passes (and after the push in Step 5, if pushed):

1. **Bump the `-u` suffix** in `package.json` `version` to `-u$V2` (keep the
   `<yapi-core>` part unchanged unless the maintainer bumps it). For example,
   syncing to `0.8.0` changes `0.1.0-u0.7.0` → `0.1.0-u0.8.0`:
   ```bash
   # set package.json version to <yapi-core>-u$V2, then sync derived metadata
   node -e 'const fs=require("fs");const p="package.json";const j=JSON.parse(fs.readFileSync(p));const core=j.version.replace(/-u.*$/,"");j.version=core+"-u"+process.argv[1];fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n")' "$V2"
   node scripts/sync-version.js
   ```

2. **Update the fork profile's `current_base_tag`** to `$V2` in
   `.fork-skills/profile.json` (`versioning.current_base_tag`). These two are a
   visible mirror of each other — both must move together.

3. **Commit and push** the version bump:
   ```bash
   git add package.json manifest.json versions.json README.md .fork-skills/profile.json
   git commit -m "chore(sync): bump upstream base to $V2"
   git push origin HEAD
   ```

4. **Confirm** in the final summary that the version suffix and
   `current_base_tag` now reflect `$V2`.

Skip this step only if the sync was abandoned (verification failed or the user
rolled back to **b1**).
