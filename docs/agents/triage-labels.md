# Triage Labels

The skills speak in terms of six canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker (Multica).

Labels are **workspace-scoped** in Multica (shared across all projects) and are already created with the seed colors — see `issue-tracker.md` → *Labels*. The right-hand column matches the label names verbatim; do not edit them without also renaming the labels in the workspace (`multica label list --output json`).

| Label in mattpocock/skills | Label in Multica   | Meaning                                  |
| -------------------------- | ------------------ | ---------------------------------------- |
| `needs-triage`             | `needs-triage`     | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`       | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`  | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`  | Requires human implementation            |
| `wontfix`                  | `wontfix`          | Will not be actioned                     |
| `done`                     | `done`             | Landed; implemented and criteria met     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table — and in Multica apply it **by UUID** (`issue label add <id> <label-UUID>`), not by name.

## Multica adds two dimensions on top of labels

Multica carries a native **status** (board column) and **assignee**, so each triage role is really a triple — label + status + assignee. See `issue-tracker.md` → *Triage mapping* for the full table. The important one: "mark ready for an AFK agent" means add `ready-for-agent` **and** set status `todo` **and** `multica issue assign <id> --to builder` (assigning an agent is what wakes it). `/finish-issues` sets `done` (status `done`), then the planning session merges and closes.
