# Issue tracker: Multica

Issues and PRDs for this repo live as issues in a [Multica](https://github.com/multica-ai/multica) workspace. Multica is an open-source, AI-native team workspace: agents are first-class members that get assigned issues, comment, change status, and run code — so an issue that is fully specified and **assigned to an AFK agent** is picked up and implemented with no human in the loop. Use the `multica` CLI for all operations; it is authenticated as the workspace owner and emits JSON via `--output json`, so a pi session running in this repo drives it directly (treat it like `gh` — no MCP bridge or in-app routing needed).

Issue identifiers look like `YAP-1`, `YAP-42` — `YAP` is the **workspace** prefix, shared across every project in the workspace.

## Recorded values

- **Workspace** — id `e1cd2ee1-fbef-4200-8451-a9dbbb6f1ad7`, slug `yapi`, issue prefix `YAP`. **`export MULTICA_WORKSPACE_ID=e1cd2ee1-fbef-4200-8451-a9dbbb6f1ad7` at the start of every session** (see *Workspace — pin it with an env var* below).
- **Repo URL** — `git@github.com:ruttybob/obsidian-pivi-cross.git` (origin; registered at the workspace level).
- **AFK agents** — `builder` (implement) and `reviewer` (code-review); see *AFK agents — builder & reviewer* below.
- **Current feature project**: _(empty — filled when the first feature effort starts)_.

## Model

Two layers:

- **Workspace** — the active target of every `multica` command; owns a single shared issue **prefix** (`YAP`), read with `multica workspace get` → `issue_prefix`. **One workspace is shared across all this repo's feature projects**. Resolution priority for the active workspace: `--workspace-id` flag > `MULTICA_WORKSPACE_ID` env > profile default (set by `multica workspace switch`).
- **Project** — a scoped board. **A project is a FEATURE, not the repo**: each new feature effort creates a new project; this repo's docs point at the **current** one only. Past efforts persist in Multica (`multica project list`) but are not referenced here.

Each issue gets a workspace-wide identifier `<PREFIX>-<number>` (`YAP-42`) plus a UUID, and carries a **status** (board column), **priority**, **assignee** (member / agent / squad), and **labels**. The **repo itself is attached once at the workspace level** (not per project) — see *Repo attachment*.

## Workspace — pin it with an env var

The `multica` CLI resolves the active workspace as: `--workspace-id` flag > `MULTICA_WORKSPACE_ID` env > profile default (set by `multica workspace switch`). **Pin it with the env var at the start of every session — interactive or scripted** — reading the recorded id from *Recorded values* above:

```bash
export MULTICA_WORKSPACE_ID="e1cd2ee1-fbef-4200-8451-a9dbbb6f1ad7"
```

This is deterministic: every `multica` command in that session targets the recorded workspace regardless of profile state, and it is immune to another session's `switch`. It is the **primary** mechanism — no per-session `workspace get` / `switch` ritual.

The sanity check is a **fallback only** — for a quick one-off command in a shell where you didn't export, or to recover a drifted profile:

```bash
multica workspace get --output json | jq -r .slug      # active workspace; expect "yapi"
multica workspace switch yapi                          # only if it drifted and you can't export
```

`switch` is still needed once (at setup, or to recover) to populate the profile default for commands that run with no pin at all.

## Repo attachment (once, at setup)

The repo is registered **once at the workspace level** so agents can check out working copies; per-feature projects do **not** re-attach it. Already done at setup:

```bash
multica repo add git@github.com:ruttybob/obsidian-pivi-cross.git
```

- Agents get isolated working copies on demand — `multica repo checkout <url> [--ref <branch|sha>]` creates a **git worktree on a dedicated branch** from the daemon's bare-clone cache, so concurrent AFK agents / tasks on the same repo run in parallel without clobbering each other (bounded by each agent's `--max-concurrent-tasks`, default 6). This is why the repo is registered even when it is already cloned locally — worktree isolation is per-task.
- **Remote URL is the parallel-safe default.** The `github_repo` resource-type name is host-agnostic; the clone is generic git, so GitHub / Bitbucket / self-hosted git all work. The daemon (your local process) does the cloning and inherits your SSH agent / key, so private repos over SSH work as long as the daemon was started with the key available (`multica daemon restart` from a shell that has the agent loaded, if not).
- **`local_directory` fallback** (repo with no remote) — attach the existing local clone: `multica project resource add <project-id> --type local_directory --local-path <abs> --daemon-id <id>`. ⚠️ `local_directory` uses a **path lock** with no per-task worktree, so concurrent tasks on that repo **serialize** — prefer the remote URL when parallel AFK agents matter.
- The per-project `--repo` resource link (`multica project create --repo …` / `multica project resource add …`) is **optional** and skipped by default — the workspace registration above is what agents use.

## Projects = features (the current-project pointer)

This doc holds a **current feature project** pointer (see *Recorded values* above) — overwrite it every time a new effort starts:

- **Starting a new effort**: create a new project, publish there, and **overwrite the pointer**:
  ```bash
  multica project create --title "<feature name>" [--icon …] [--lead builder]
  # record the returned id (UUID) as the current-project pointer in "Recorded values"
  ```
  `--title` (required) = feature name; `--icon` (optional, emoji); `--lead` (optional, the AFK agent). There is no `--workspace-id` on `project create` — it lands in the active workspace (mind the workspace check above).
- **Discover the current project**: read the pointer in *Recorded values*; fall back to `multica project list --output json`.
- **Past efforts**: still in Multica — `multica project list --output json`; not referenced from this repo.
- `--project <UUID>` on `issue create` / `issue list` requires the UUID — titles are **not** fuzzy-matched.

## Labels (workspace-scoped — created once at setup)

Labels live on the workspace, shared across all projects. The **six triage** labels are already created with the seed colors. Check with `multica label list --output json`. Recreate any that go missing:

```bash
# triage (see triage-labels.md)
multica label create --name needs-triage    --color "#F59E0B"
multica label create --name needs-info      --color "#3B82F6"
multica label create --name ready-for-agent --color "#10B981"
multica label create --name ready-for-human --color "#8B5CF6"
multica label create --name wontfix         --color "#6B7280"
multica label create --name done            --color "#22C55E"
```

The `wayfinder:*` labels are **not** created here — wayfinding runs on the local `.scratch/` tracker, not Multica (see *Wayfinding*).

## Conventions

Operate on the **current feature project** (read its UUID from *Recorded values*; mind the active workspace — see above).

- **Create an issue**: `multica issue create --title "..." --project <UUID> --description "..."`. For multi-line bodies prefer `--description-stdin` (heredoc) or `--description-file <path>` — the bare `--description "..."` decodes `\n`/`\t`/`\\` and mangles literal backslashes. Optional flags: `--status {backlog,todo,in_progress,in_review,done,blocked,cancelled}` (default `backlog`), `--priority {urgent,high,medium,low,none}` (default `none`), `--assignee <name>` (fuzzy; member / agent / squad), `--parent <id>` (sub-issue), `--stage <n>` (barrier group under the parent). (**Note:** `issue create` has no `--label` flag — apply labels after creation, below.)
- **Read an issue**: `multica issue get YAP-42 --output json` (accepts `<PREFIX>-<number>` **or** UUID). Comments separately: `multica issue comment list YAP-42 --output json`.
- **List issues**: `multica issue list --project <UUID> [--status …] [--priority …] [--assignee …] [--metadata k=v …] [--sort …] [--limit 50] --output json`. Output is a paginated **envelope** `{"issues":[…], "has_more":bool, "total":int, "limit":int, "offset":int}` — read the `issues` array; page with `--offset` when `has_more`.
- **Comment**: `multica issue comment add YAP-42 --content "..."` (markdown) or `--content-stdin`; `--parent <comment-id>` replies in a thread.
- **Update**: `multica issue update YAP-42 [--title …] [--status …] [--priority …] [--description …] [--assignee …]`.
- **Status** (first-class state machine): `multica issue status YAP-42 <status>` (`backlog todo in_progress in_review done blocked cancelled`). No separate "close" — `done` is the landed terminal state, `cancelled` drops it.
- **Labels — add/remove by UUID** (⚠️ not by name — the CLI rejects names with "expected a UUID prefix …"):
  ```bash
  LID=$(multica label list --output json | jq -r '.[] | select(.name=="ready-for-agent") | .id')
  multica issue label add    YAP-42 "$LID"
  multica issue label remove YAP-42 "$LID"
  multica issue label list   YAP-42
  ```
- **Assignee — the native AFK trigger**: `multica issue assign YAP-42 --to <name>` (fuzzy member / agent / squad), `--to-id <UUID>`, or `--unassign`. **Assigning to an agent is what wakes it** — pair with `status todo`. Candidates: `multica agent list --output json`.
- **Search**: `multica issue search "migration"` (title / description); `--include-closed` adds `done` / `cancelled`.

## Dependencies / blocking

Multica's native relationships are **containment** (`--parent` → sub-issue) and **ordered barrier groups** (`--stage <n>` under a parent; the parent is woken only when every sub-issue in a stage finishes). There is **no native peer "blocks / blocked-by" link** in the CLI. So:

- **Containment** (a spec owns its tickets) → `--parent <id>` (native).
- **Barrier ordering between groups** → `--stage <n>` (native).
- **Peer "ticket B blocked by ticket A"** → **body convention** (the skills' own fallback): put `## Blocked by: <ticket title>` in B's body.

## Triage mapping (status + assignee on top of labels)

Multica gives two native dimensions — **status** (board column) and **assignee** — on top of labels. The triage skills drive state through the six canonical labels (see `triage-labels.md`), but in Multica each role also maps to a native state, and `ready-for-agent` additionally assigns **builder** (see *AFK agents — builder & reviewer* below):

| Triage role       | Label             | Status      | Assignee                           |
| ----------------- | ----------------- | ----------- | ---------------------------------- |
| `needs-triage`    | `needs-triage`    | `backlog`   | unassigned                         |
| `needs-info`      | `needs-info`      | `blocked`   | reporter (optional)                |
| `ready-for-agent` | `ready-for-agent` | `todo`      | **builder** (assign to wake)       |
| `ready-for-human` | `ready-for-human` | `todo`      | a human member (or unassigned)     |
| `wontfix`         | `wontfix`         | `cancelled` | unassigned                         |
| `done`            | `done`            | `done`      | set by **reviewer** (clean review; merged by the planning session) |

So when a skill says "mark this ready for an AFK agent", do all three: add `ready-for-agent`, set status `todo`, and `multica issue assign YAP-42 --to builder`. (When a skill applies the `ready-for-agent` label, in Multica that means this triple.)

## AFK agents — builder & reviewer

This workspace runs **two AFK agents** (both on the `pi` runtime, model `zai/glm-5.2`, workspace-visible). The planning session plans and merges; the agents implement and review — no human in the loop until a handoff escalates.

| Agent    | Role                           | Skills                                                                  | Wakes on                                        |
| -------- | ------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------- |
| builder  | implement ready-for-agent work | `tdd`, `code-review`, `diagnosing-bugs`, `resolving-merge-conflicts`    | assign + `status todo` (the ready-for-agent triple) |
| reviewer | code-review the builder's diff | `open-code-review` (`ocr` CLI, DeepSeek)                                | assign + `status in_review`                     |

**Handoff loop:**

```
ready-for-agent (label + status todo + assign builder)
  → builder implements (tdd → self code-review), commits on a branch
  → status in_review + assign reviewer  (+ summary comment: branch, merge-base SHA, commit range)
  → reviewer runs ocr on the builder's diff
      ├─ clean      → status done (reviewed, ready to merge) + summary comment
      └─ issues found → status in_progress + assign builder (+ review comment)
  → [planning session] merges the done branch into main, then closes
```

- **Merge is not an agent step.** Neither agent merges into `main` — the planning session does, after `done`. `done` means *reviewed, ready to merge*, not *merged*.
- **Loop guard.** If an issue returns to the same agent a 2nd time in the same state over the same point (builder↔reviewer ping-pong), that agent stops the loop: `status blocked` + `ready-for-human` + a "ping-pong detected" note, instead of handing on.
- **Escalation.** Ambiguous spec or a real blocker → the agent stops (does not half-close): `status blocked` + `needs-info`/`ready-for-human` + a note of where it got stuck.
- Agent names are short slugs (`builder`, `reviewer`) for fuzzy `assign --to`.

## `.scratch/` snapshot (sync from Multica)

Multica is the source of truth for PRD + issues; this repo mirrors them into `.scratch/<project-slug>/` as versioned git artifacts (history, code review). The mirror is a **snapshot, not a live source** — it lags Multica by up to the sync interval.

- **`<pi-matt-skills>/scripts/sync-issues.sh [project-slug]`** — the sync script lives in the shared `pi-matt-skills` repo (not per-repo here): `~/pets/pi-matt-skills/scripts/sync-issues.sh`. It is **workspace-env-pinned** (`MULTICA_WORKSPACE_ID`, default this repo's `yapi` workspace). For each project (or one by slug): writes `.scratch/<project-slug>/issues/<IDENT>-<slug>.md` per issue (frontmatter: identifier, title, status, assignee, labels, parent) and mirrors the root issue (no parent) to `.scratch/<project-slug>/PRD.md`. Full refresh per project; idempotent commit `chore(sync): multica issues → .scratch/` when anything changed.
- **Triggers:** cron hourly (`0 * * * *`, log `~/.multica/logs/sync-issues.log`, entry tagged `multica-sync:pi-matt-skills`) and **on-demand** — a pi session runs the script after writing to Multica, or before reading `.scratch/`.
- **Orphaned snapshots:** `.scratch/` may hold project dirs whose Multica project has since been deleted (`multica project list` is the source of truth for what currently exists). Treat such dirs as historical record only; they are not recreated on the next sync.

## Wayfinding operations

`/wayfinder` consults this section. **Wayfinding does not run on Multica** — its `prototype` / `grilling` tickets are HITL brain-phase work an AFK agent cannot drive, and Multica holds execution issues only. Run wayfinder against the **local-markdown tracker** instead (`.scratch/<feature-slug>/`): the map is `.scratch/<feature-slug>/map.md`, tickets are `.scratch/<feature-slug>/tickets/<NN>-<slug>.md` with body-convention `## Blocked by: <title>` (local markdown has no native dependency edges). The `wayfinder:*` labels are therefore **not** created in this workspace.

## Pull requests as a triage surface

**No.** Multica is a standalone issue tracker; `multica issue pull-requests <id>` lists PRs *linked to* an existing issue (read-only context), not a triage inbox. Skip the PR question.

## When a skill says "publish to the issue tracker"

If this is a **new feature effort**, first create a project and update the current-project pointer (*Projects = features*), then create the issue(s) in it:

```bash
multica issue create --project <current-UUID> --title "..." --description "..."
```

A new effort creates the project and the spec (as the parent issue); task tickets are then decomposed as children (`--parent`), wiring blocking per *Dependencies*. Apply the `ready-for-agent` triple to agent-grabbable tickets.

## When a skill says "fetch the relevant ticket"

`multica issue get <PREFIX>-<number> --output json` (and `multica issue comment list <PREFIX>-<number>` if the conversation is needed).
