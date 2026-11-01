# Warcraft Puzzles

A collection of Warcraft browser puzzles, beginning with a daily crossword. Every clue
belongs to Warcraft. Answers can be recognisable names or ordinary English words with a
supported Warcraft connection. The historical boundary is the end of Wrath of the Lich
King.

**Current milestone: grid feasibility.** This repository contains 342 answer–clue–hint
triads, source references, strict content contracts, a tested grid engine and a
reproducible fill benchmark. It does not contain the player application yet. The seed
remains unapproved for publication pending cold solving in finished grids. The expanded
benchmark found no fills in its 29 diagnostic layouts. The bank still needs broader
crossing coverage; see the measured results and limits below.

## Run the checks

Use Node 26 and pnpm 11.18.0, as pinned in the repository.

```sh
pnpm install --frozen-lockfile
pnpm check
```

No Warcraft installation, private credentials or research database is required. The same
checks run in GitHub Actions on Linux. Required branch protection must be enabled after
the GitHub repository exists. A workflow file alone does not prevent a repository owner
from bypassing checks.

## Work on the content

```sh
pnpm content:check
pnpm content:report
pnpm content:report:check
pnpm test:watch
pnpm benchmark:run
pnpm benchmark:check
```

- [`content/seed/editorial.json`](content/seed/editorial.json) contains authored
  answers, facts, clues, hints and exact citations.
- [`content/seed/evidence.json`](content/seed/evidence.json) records the research
  database fingerprint, source versions and row/excerpt checksums.
- [`docs/seed-report.md`](docs/seed-report.md) is the generated human-readable
  inventory, including every triad and its provisional difficulty.
- [`docs/seed-revision.md`](docs/seed-revision.md) explains the rebalance toward
  multi-word world names, everyday play and useful short crossings.
- [`docs/seed-review.md`](docs/seed-review.md) records the latest refinements to clues,
  hints and provisional difficulty.
- [`docs/seed-expansion.md`](docs/seed-expansion.md) records the first 242-answer
  expansion, its evidence, additional layouts and comparison with the original seed.
- [`docs/editorial.md`](docs/editorial.md) defines eligibility, hints, review and
  source-update rules.
- [`docs/testing.md`](docs/testing.md) explains checks and their limits.
- [`docs/fill-benchmark.md`](docs/fill-benchmark.md) records reproducible layout/fill
  outcomes and crossing diagnostics for the seed and name-only control.
- [`docs/grid-engine.md`](docs/grid-engine.md) explains the engine, benchmark inputs,
  first findings and next content priorities.
- [`docs/production-plan.md`](docs/production-plan.md) is the approved project plan.
- [`docs/progression-design.md`](docs/progression-design.md) details the accepted
  progression roadmap: lore discoveries, streaks, weekly goals and later cosmetic
  collections. These features are not implemented; economy values remain provisional.

Optional source replay requires the pinned Classic database produced by the sibling
`wow-data` project. Pass its path explicitly:

```sh
pnpm content:verify-sources --database /absolute/path/to/classic.db
```

`pnpm content:refresh --database /absolute/path/to/classic.db` is a deliberate research
update. It verifies exact excerpts and changes the source snapshot. Changed source
rows/versions invalidate previous evidence-review digests. Do not bulk-rewrite those
digests without actually reviewing the affected entries.

To exercise the stricter publication gate:

```sh
pnpm content:check --publication
```

**This currently fails intentionally:** the seed has no cold approvals. Research
validation passing does not authorise publishing the seed as finished puzzles.

## Next milestones

1. Expand the bank from the measured length and crossing-letter gaps, rerunning the
   fixed benchmark after each sourced batch. Add further valid blocked layouts.
2. Review seven puzzle candidates once fills succeed and prepare six to twelve sourced
   lore pages. Research results do not grant publication approvals.
3. Build the responsive Next.js player with the first lore discoveries, streak/calendar
   and milestone stamp; validate the experience through cold solves and phone trials.
   Follow with the editorial workspace and public daily/weekly loop.
4. Add application integration/browser/accessibility tests and a production build to the
   required checks as those features are implemented.

The selected production target is the owner's **existing Vercel Pro plan**, with
PostgreSQL on Neon. No additional Vercel subscription is needed. This repository has not
been connected to a deployment or provisioned paid services.

## Source material and attribution

The current evidence comes from `wow-data`'s pinned Classic database: game text from
[CMaNGOS Classic DB](https://github.com/cmangos/classic-db) and
[QuestieDB](https://github.com/Questie/QuestieDB), plus exact client names provided
through [wago.tools](https://wago.tools). Frozen source versions and license metadata
are recorded in the snapshot. Client labels establish spelling, while text passages and
spell descriptions support the actual clue facts. Selected game-text excerpts retain
their original rights and are not licensed as this project's original writing. Public
export and source-attribution review remain required before publication.

World of Warcraft belongs to Blizzard Entertainment. This is an independent fan project,
not affiliated with or endorsed by Blizzard.
