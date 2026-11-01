---
name: dispatch
description:
  "The lead's half of opening a warcraft-puzzles task (which role, the lock, the brief
  and its title), with the child skill opening the session and seeing it through. Use
  with child whenever this session is the dispatch, or a task here needs a role it
  doesn't have."
---

# Dispatching a task

The dispatch is the lead. There are no persistent leads: each task gets one session,
opened in `~/code/warcraft-puzzles`, with one role's brief. This skill decides the role
and the brief. The `child` skill (`~/.claude/skills/child`) opens the session and sees
it through: load both.

## 1. Which role

By the files the task writes (the role briefs in `docs/roles/` list them). A task across
two roles is two cards in order, or one card under the role of the larger part, its
brief naming the other area for the reviewer. Until the bank's go/no-go the order is
content first (`CLAUDE.md`).

## 2. The lock

One writing card at a time here (the lock is per repository, and `session.ts` says when
it is held). Read-only work, an audit or a cold-solve, needs no lock and can run beside
a writer.

## 3. The title and the brief

The title is `[<role>] <task>` (`[content] Cut the padding triads`): `child` takes the
task's own title, the dispatch adds the role in front. It names the child and its card.

The brief, the task text `child` passes to `session.ts`: the user's words, quoted, then
the role's brief file (`docs/roles/<role>.md`), the goal, the files, the checks that
must pass, what not to touch, a precedent commit if there is one, the done condition. A
content task names the `content-change` skill, a release `puzzle-release`. Its gates are
the ones in `CLAUDE.md`, content's own first.

## 4. Opening

As `child` says, with the title above and `--repos warcraft-puzzles`. Both kinds map to
Sonnet here (`harness.toml [session] models`), and `child` settles the kind and a plan
as it always does.

## 5. Seeing it through

`child`'s "Seeing it through": the reports, the goes quoted, the checks before closing,
the close. One check of this project's: the card's title still starts with its role.
