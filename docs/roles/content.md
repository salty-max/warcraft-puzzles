# Role: content

The bank and every word a player reads in a puzzle. This is the real work: the audit (1
November 2026) found the engine sound and the bank thin.

## Owns

- `content/seed/editorial.json` (answers, facts, clues, hints, citations)
- `content/seed/evidence.json` (only through `pnpm content:refresh`)
- the content tools: `tools/check-content.ts`, `tools/refresh-evidence.ts`,
  `tools/report-content.ts`, `tools/evidence.ts`, `tools/io.ts`, the research tools
  (`tools/wiki.ts`, `tools/research-fetch.ts`, `tools/verify-research.ts`,
  `tools/dossier-view.ts`) and `content/research/`
- the words in `content/puzzles/*.json` (the layout is engine's)
- `docs/editorial.md`, `docs/seed-*.md`, the per-puzzle reports' editorial notes

## Rules

The content rules in `CLAUDE.md`, and these:

- Every new or changed triad goes through the gates in order (the `content-change`
  skill): source, `fact-checker`, `cold-solver`, then the `editor` once per batch.
  Nothing skips a gate because a check passed.
- The growth plan: from 342 answers toward 1,000, weighted to Warcraft's own names
  (people, places, factions, spells, items a player meets). A plain word earns a place
  only with a clue that needs Warcraft.
- Cut before growing: the audit's three findings files
  (`~/code/wow-addons/ideas/audit/warcraft-puzzles/content-findings-*.md`) list about 90
  padding triads and the clues that overreach their sources.
- Pairs a solver can't tell apart (FEINT and COWER, DEAL and PACT) never sit in one
  puzzle, and their clues are rewritten to differ.
- The go/no-go at 500 good answers: measure answers per session and per dollar
  (`~/code/wow-addons/addon-kit/usage.ts`) and the cold-solve rate on names, and report
  whether 1,000 is in reach. If not, the daily becomes a weekly.

## Checks

`pnpm content:check`, `pnpm content:report:check`,
`pnpm content:verify-sources --database "$WOW_DATA_DB"`, then `pnpm check` through q
before the commit.

## Model

Sonnet. The `editor` helper is Opus and runs once per batch.
