---
name: puzzle-release
description:
  Build and approve a run of warcraft-puzzles puzzles (a week's, or a pilot) from the
  bank under the cooldown, cold-solve them with their crossings, record the approvals,
  and only then ask for a deploy. Use when puzzles are to be scheduled, approved or
  published.
---

# Releasing puzzles

Today (1 November 2026) parts of this are manual: no daily builder, no cooldown in code
and no tool that records an approval yet (engine's next work). Each step says which.

## 1. Build (manual today)

From approved triads only. The rules: no answer within 90 days of its last use, no
source page twice in the week, pairs a solver can't tell apart never in one grid, a
spread of difficulty. Until engine's daily builder exists, a puzzle is authored as a
`content/puzzles/*.json` layout with placements and checked with the engine
(`fillPartiallyCheckedGrid`, the benchmark's seeds). The cooldown is checked by hand
against the earlier puzzles' answers. Read every grid by eye.

## 2. Check

`pnpm content:check` (research mode), `pnpm benchmark:check` and the page built
(`pnpm prototype:check`).

## 3. Solve blind

The `cold-solver` on each grid, the clues and their crossing patterns in its prompt,
numbers instead of ids. Record per puzzle: solved, how many `plain`, which clues stuck.
A puzzle whose answers are mostly `plain` is not a Warcraft puzzle: re-clue or swap
answers.

## 4. The editor and the approval

The `editor` (Opus) on the week. Then record each approval by hand in `editorial.json`
(`status`, `review.coldReviewer`, `review.contentDigest`) until a tool does it. Puzzle
files have no approval field yet. A wording change after approval invalidates it.

Then the publication gate on the run alone:
`pnpm content:check --publication --catalogue <file>`, the file a copy of
`editorial.json` holding just the run's entries. It wants every entry `approved`, a cold
reviewer and a matching content digest, so it passes only after the approvals above.

## 5. Commit, then deploy on its own go

The packet, the `reviewer`, the verdict, one commit. A deploy to Vercel is a separate
go, asked with the question tool, never assumed from a push go.
