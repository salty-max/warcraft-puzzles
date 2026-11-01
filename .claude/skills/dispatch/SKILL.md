---
name: dispatch
description:
  Open a warcraft-puzzles task in a session of its own with the right role (content,
  engine, front, back), brief it, and take its report back. Use when the user hands this
  project a task and this session is the dispatch (the lead), or when a task here needs
  a role it doesn't have.
---

# Dispatching a task

The dispatch is the lead. There are no persistent leads: each task gets one session,
opened in `~/code/warcraft-puzzles`, with one role's brief.

## 1. Which role

By the files the task writes (the role briefs in `docs/roles/` list them). A task across
two roles is two cards in order, or one card under the role of the larger part, its
brief naming the other area for the reviewer. Until the bank's go/no-go the order is
content first (`CLAUDE.md`).

## 2. The lock

The board's lock is per repository: one writing card at a time here. Check
`bun harness/board.ts held warcraft-puzzles` before opening a writer. A second writer
waits (blocked `--on` the holder). Read-only work (an audit, a cold-solve) needs no
lock.

## 3. The brief

The user's words, quoted. The role's brief file. The goal, the files, the checks that
must pass, what not to touch, a precedent commit if there is one, the done condition.
Its first write is its card, titled `[<role>] <task>`.

## 4. The model

Sonnet for every role: the repository's `.claude/settings.json` sets it, so a session
opened here (the desktop's session tool, or `claude` in `~/code/warcraft-puzzles`) runs
on Sonnet with nothing passed, and `harness.toml` makes the vendored `session.ts` open
both kinds on Sonnet too. Opus only for a plan the user must approve, and inside a
session for the `reviewer`, `architect` and `editor` helpers (their own frontmatter
picks it).

## 5. The gates the session runs before its commit

The role's checks through q, `bun harness/packet.ts warcraft-puzzles`, the `reviewer` on
the packet, its findings fixed, `bun harness/review.ts warcraft-puzzles "<verdict>"`,
one commit. Content adds its gates first (the `content-change` skill).

## 6. The report back

The card's status, the commit sha, the q verdict, the reviewer's verdict, and what waits
on whom. A push, a deploy, a release, a GitHub repository: each is a go the session asks
the user itself, with the question tool, and quotes in its report.

## 7. Closing

Check the work (the card, the commit, the checks, the diff's shape) before telling the
user it is done, then close the session.
