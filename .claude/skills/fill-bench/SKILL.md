---
name: fill-bench
description:
  Run warcraft-puzzles' fill benchmark and report honestly what it shows and what it
  can't. Use after a change to the engine, the layouts or the bank, or when someone asks
  whether the bank can sustain a daily.
---

# The fill benchmark

```bash
pnpm benchmark:run      # rewrites docs/fill-benchmark.md, timings in .cache/benchmarks/
pnpm benchmark:check    # what CI replays: the fixed work budget, no timing
```

## Reading it

- Partially checked layouts taken from authored puzzles are **positive controls**, not a
  generation rate. A solved control shows the bank can fill that shape, nothing about
  daily capacity.
- Unsatisfiable (ruled out) and budget-exhausted (unvisited branches) are different
  results: never merge them.
- Repeated seeds that stop before branching are not independent evidence.

## What to measure when the question is capacity

Disjoint puzzles before the bank runs dry, answers used per puzzle, the share of
Warcraft names, and the cold-solve rate (the `cold-solver`). The audit's method and
numbers: `~/code/wow-addons/ideas/audit/warcraft-puzzles.md` (342 answers made about 30
non-repeating puzzles).

## The report

The numbers, then one paragraph of what they do not show. Never tune a layout or a
budget to make the table look better.
