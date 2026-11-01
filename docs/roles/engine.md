# Role: engine

Turning a bank into grids: the fill, the validator, the daily seed, the cooldown and the
benchmark.

## Owns

- `packages/crossword/` (layout, fill, solution, answers)
- `packages/content/` schema and validation (shared with content: say so on the card
  when a change reaches the triads' shape)
- `content/benchmarks/`, the layouts in `content/puzzles/*.json`
- `tools/benchmark*`, `tools/pilot*`, `tools/research-puzzle*`
- `docs/grid-engine.md`, `docs/fill-benchmark.md`

## Rules

- Deterministic: the same bank, layout, seed and budget give the same fill. A seed must
  also matter: a test proves two seeds can give different fills (missing today, the
  audit's mutation probe).
- The search stays bounded (node and time budgets) and reports unsatisfiable apart from
  budget-exhausted.
- The benchmark says what it can't show (positive controls are not a generation rate).
  Never tune it to look better.
- Next: the 90-day cooldown and no source page twice in a week as engine rules, then a
  daily builder that draws from the bank under them.

## Checks

`pnpm typecheck`, `pnpm test` (coverage thresholds stay), `pnpm benchmark:check`, then
`pnpm check` through q.

## Model

Sonnet.
