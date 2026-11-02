# Grid engine and research benchmark

The first feasibility tool runs entirely from this repository. It needs neither
`wow-data` nor a hosted application. The seed stays evidence-checked research content; a
fill is never a publication approval.

## Run and reproduce

```sh
pnpm benchmark:run
pnpm benchmark:check
pnpm check
```

`benchmark:run` writes the human-readable [fill report](fill-benchmark.md) and an
ignored `.cache/benchmarks/latest.json` containing every case, individual search
timings, total benchmark elapsed time, Node version, platform, architecture and CPU.
Timing excludes report formatting/writing. The report's input checksum binds the
editorial catalogue, source snapshot and benchmark configuration. Algorithm version,
layouts, seeds and node budget are recorded. Reproduce a historical report from its
repository revision, including its lockfile.

`benchmark:check`, also part of required local/CI checks, reruns the deterministic
workload and rejects a stale report. It does not rewrite outputs or compare
machine-dependent timings. Changing timing observations cannot make CI green. The
workflow uploads the report with coverage and the seed inventory.

An alternative input/output run is explicit:

```sh
pnpm benchmark:run --config /path/to/layouts.json --output /path/to/report.md --artifact /path/to/measurements.json
```

The CLI also accepts `--catalogue` and `--evidence`. It validates the research catalogue
before searching, excludes draft/rejected triads and rejects unknown flags. Input JSON
and layouts have strict runtime contracts. It never changes content reviews or contacts
an external service.

## Layout and fill contracts

`packages/crossword` contains the browser-compatible domain rules. Layouts use `.` for
white cells and `#` for blocks, with dimensions from 3 to 25 cells on each axis.
Rectangular layouts are allowed. Every white cell must belong to both an Across and a
Down run of at least three letters, and all white cells must be connected orthogonally.
Rotational symmetry is reported but remains optional.

Starts receive numbers in reading order. A cell starting both directions shares its
number, with stable IDs such as `1A` and `1D`. Crossings record reciprocal letter
offsets. No partially checked letters or isolated one-letter runs are silently accepted.

The engine takes `{ id, grid }` candidates, preserving the originating triad ID. It does
not rewrite display spelling or multi-word enumeration: those stay in the content
catalogue. KIRINTOR occupies eight cells while its triad retains `(5,3)`. Different clue
IDs with the same grid string count as one available word. The first engine picks the
lexically first ID as a stable representative; editorial selection of clue alternatives
remains separate.

An independent fill inspector requires exactly one placement per slot, known references,
matching lengths, consistent crossing letters and no repeated normalised answer. The
benchmark validates every claimed success with that inspector before reporting it. A
valid fill still needs clue/fact overlap checks, familiarity review and cold solving
before release.

## Search and limits

1. Check whether the distinct word supply meets the number of slots at each length. A
   shortage is a proof for this particular bank/layout.
2. Remove candidates without supported crossing letters. Forced words are removed from
   other slots. Repeat until stable or a domain becomes empty.
3. Branch on the smallest remaining domain, trying candidates in a seeded order.
   Backtrack after contradictions. There is no global random state.

The seed, candidate ordering and state budget determine reproducible search results. The
budget counts entered search states, including the root. A fill at the last allowed
state still succeeds; a contradiction after exploring all branches remains
unsatisfiable. Unvisited branches produce `budget-exhausted`. The engine also supports
an optional cooperative search-time guard. It checks between states and propagation
steps; it is not a hard process deadline and does not cover parsing/preflight. Batch
runners can add an external timeout.

Diagnostics retain length deficits and bounded examples of crossing/uniqueness dead ends
with the remaining letter support at every offset. They are conditional examples, not a
minimal unsatisfiable core or a guarantee that adding one matching word repairs a grid.
The engine applies arc consistency and forced-word exclusion, not a full all-different
matching algorithm or layout generation.

## Historical first baseline

The initial configuration has 18 original layouts across 5×5, 7×7, 9×9, 11×11 and 13×13,
three seeds and two cohorts: all 100 seed answers, and the 55 proper names alone. All
108 cases are unsatisfiable for their exact input. None stops at a search limit. The
full bank fails length preflight on twelve layouts and crossing propagation on the other
six, before branching. Repeating seeds does not add independent evidence in those cases.

These layouts deliberately expose different length demands; open large grids require
many long answers. They do not represent every sensible blocked layout or establish that
dense Warcraft crosswords are impossible. The name-only control is from the same sourced
seed, not the older unrestricted name-list experiment. No claim about improvement over
that historical experiment follows.

At that baseline, the five-letter pool had no answers beginning with A, I, O or U. In an
open 5×5, every letter in the first Across answer must also start a Down answer. No
current five-letter word met that support constraint. This was a concrete
crossing-coverage problem that total word counts missed.

Two useful diagnostic targets are `bridge-9`, which needs nineteen distinct three-letter
words against twelve then available, and `bridge-13`, which needs ten four-letter words
against eight then available. Those deficits are lower bounds for those layouts only.
Adding seven and two words respectively does not guarantee fills.

## Expanded bank

The [first expansion](seed-expansion.md) increases the bank to 342 answers and the suite
to 29 layouts. All original layouts remain. Eight full-bank layouts now fail length
preflight; the other twenty-one fail crossing/uniqueness search. All 174 cases across
three seeds and two cohorts are unsatisfiable, with none budget-limited. The five-letter
pool now covers initial A, E, I, O and U. That improvement still does not produce a
valid fill. The [current report](fill-benchmark.md) is generated and replayed in CI; the
[100-answer report](benchmarks/seed-100.md) is historical.

## Next content batch

Prioritise sourced three- to seven-letter vocabulary, including ordinary words with fair
Warcraft clues. Broaden initial/final letters and internal vowel coverage rather than
only increasing the number of answers. Preserve familiar multi-word names for longer
slots. Do not relax the ban on obscure quest titles, routine loot, minor NPC labels or
arbitrary dictionary filler.

Extract and review in batches, rerun these fixed layouts, then add other valid blocked
layouts if the fixtures overconcentrate particular lengths. Keep failed runs. A
500–1,000-answer sample remains an experiment, not a known sufficient bank. Seven
candidate puzzles, lore pages and responsive playtesting follow successful construction;
none is claimed by this baseline.

## Explicit partially checked construction trial

`compileLayout` and the fill solver retain their original fully checked behaviour.
`compilePartiallyCheckedLayout` and `inspectPartiallyCheckedFill` are explicit exports
for the authorised construction experiment. They permit a single perpendicular cell
without inventing a one-letter clue. They still reject two-letter runs, orphan cells,
disconnected shapes, missing entries, inconsistent crossings and repeated answers.
Numbering counts actual entry starts only.

The research-puzzle validator adds a trial-specific checking floor
(`checkingFloorIssues`, `packages/crossword/src/floor.ts`, changed 1 November 2026 on
the owner's go): every answer needs two crossings and 40% checking up to seven letters,
a flat three crossings beyond, and no more than four unchecked letters in a row. The old
flat 40% asked for four crossings on a nine-letter name and nothing filled. It then
projects the current triads into the local player. It checks simple cross-prompt
spelling leaks and binds local saves to a puzzle/wording fingerprint. None of those
checks grants publication approval. The [trial report](prototype-report.md) records the
actual construction and its weaknesses.

## Primary format and split fill results

Partially checked grids are now the primary construction format. The strict full-format
API remains available for comparison. `fillPartiallyCheckedGrid` uses the same search
implementation, seed ordering and budgets as `fillGrid`, with the explicit partial
compiler. It still enforces valid runs, connected cells, consistent crossings and unique
answers. The construction-review floor remains separate from structural search.

The benchmark labels each layout's checking rule, reports crossing-cell counts and
summarises results by format before listing individual runs. The seven partial layouts
come from authored pilots. Successful fills are independently inspected, may differ from
authored placements and remain unapproved for publication. These are positive controls,
not a claim that any arbitrary partial layout can be filled or that all automatic fills
have good clues.

## Layouts for the rebuilt bank (1 and 2 November 2026)

The seven authored layouts were drawn for three- to five-letter words. The first seven
`bank-*` layouts (9x11 to 10x12, no slot under five letters) filled the grown bank (787
triads, 761 distinct answers) but spent four to eight five-letter answers a day against
a supply of about 0.5 a day under the 90-day cooldown, so `node tools/build-playset.ts`
stopped at day 7 at any cooldown. The limit was the length mix, not the window.

The first family, `bank-l1` to `bank-l8` (9x11 to 10x12 and 9x13, nine to eleven
answers, one budget for all), took the playset to day 17. On 2 November the day-18
failure was diagnosed, and the family was widened to fourteen layouts by archetype
(below). The method, a throwaway annealer kept out of the repository, not a committed
generator:

- **The length mix is a hard input per archetype.** Supply per length is the bank
  divided by 90 days: 3-4 letters 0.9 a day, 5: 0.5, 6: 0.6, 7: 0.8, 8: 1.1, 9: 1.7, 10:
  1.0, 11: 0.6, 12: 0.4, 13 and longer 0.74 in all (38 of those 67 answers have 14 to 17
  letters and fit no layout here, so the placeable supply is 0.32 for 13 letters and
  about 8.0 answers a day in all). A candidate that leaves its archetype's slot ranges
  (glue, five, six, 7-8, 9-10, 11+, total) is rejected outright (a penalty of 100
  against a cost of 0 to 30).
- **Moves and cost.** Flip one or two cells, keep the shape only if it compiles
  (`compilePartiallyCheckedLayout`), passes `checkingFloorIssues` and every border row
  and column holds a white cell (so a 10x13 really is 10x13). The cost adds the real
  filler on the live bank (twin rule on) and four fixed random 65% samples. Six
  archetypes, two to four seeds each, seven to eight minutes a run.
- **Selection.** Up to 200 candidates per archetype on 24 random 65% samples (mulberry32
  12345), then the best that differ by at least 8 cells. The fresh figure below uses 24
  samples from mulberry32 777777 (node limit 10,000, fill seed 11).

The fourteen layouts, in the file's order, which is the builder's rotation (it starts at
the second layout on day 1, so nothing maps a day to a weekday yet). Widths stay at 9 or
10 so a phone cell stays near 31 to 35px; the long answers (11 to 13 letters) run down
the 13-tall grids.

| archetype | layouts                         | grid  | answers  | no five | what it spends                            |
| --------- | ------------------------------- | ----- | -------- | ------- | ----------------------------------------- |
| light     | `light-1`, `light-2`, `light-3` | 9x11  | 7 to 8   | yes     | one or two glue, 8-9 letters, one 11      |
| fives     | `fives-1`, `fives-2`            | 10x12 | 10       | no      | one five and one glue, 9s                 |
| mid       | `mid-1`                         | 10x12 | 10       | yes     | one glue, a six, 7-8 letters              |
| spine     | `spine-1`, `spine-2`, `spine-3` | 10x13 | 8 to 9   | yes     | one glue, a spine of 11, 12 or 13 letters |
| glue      | `glue-1`                        | 9x11  | 9        | no      | three glue and one five                   |
| big       | `big-1` to `big-4`              | 10x13 | 10 to 11 | `big-4` | two glue, a five, mostly 8-9 letters      |

Eight of the fourteen spend no five-letter answer (`light-1` to `light-3`, `mid-1`,
`spine-1` to `spine-3`, `big-4`). Fresh-sample robustness (24 random 65% samples of the
bank, twin rule on): `light-1` 0.96, `light-2` 0.58, `fives-1` 0.88, `fives-2` 0.67,
`mid-1` 0.63, `spine-1` 0.54, `glue-1` 0.88, `big-1` 0.96, `big-2` 1.00, `big-3` 0.83;
`light-3`, `spine-2`, `spine-3` and `big-4` (the lean ones that spend 11 to 13 letter
answers) are 0.21 to 0.46 and appear in the rotation only because the builder falls
through to the next layout when one fails.

What it showed, and what it can't:

- **What ran dry first was the glue, not the fives.** The first family spent 53 of the
  65 four-letter answers in 17 days (3.1 a day against 0.72 supplied) and left 12. At
  day 18 `lengthDeficits` was empty on all eight layouts and each died in one to six
  nodes at a four-letter slot. Restoring only the four-letter answers made all eight
  fill again, restoring 3, 5, 6, 11 or 12 letters none, 7 to 10 one each. The twin rule
  does not bite (off, still none fill). The earlier worry that fives at about 1 a day
  would run out was wrong: 13 fives were spent in 17 days.
- **The rotation does not meet supply.** Averaged over the fourteen layouts the family
  uses, per day: 3-4 letters 1.50 (supply 0.9), 5: 0.43 (0.5), 6: 0.50 (0.6), 7: 1.36
  (0.8), 8: 1.57 (1.1), 9: 2.64 (1.7), 10: 0.64 (1.0), 11: 0.43 (0.6), 12: 0.14 (0.4),
  13 letters 0.07 (0.32 placeable), and 9.3 answers a day against about 8.0 placeable.
  Glue, 7, 8 and 9 are over, 10 and longer are under. Layouts that lean on the long
  answers fill poorly on the bank as it stands (an annealer asked for zero glue found
  none that fills even at 20,000 nodes), so a layout with fewer, longer answers is
  fragile, not free.
- Rolling cooldown: `node tools/build-playset.ts --days 90` builds 25 puzzles in a row
  under the 90-day cooldown and day 26 has no fill (the first family stopped at 17). At
  day 26 the four-letter answers are down to 21 (44 spent, 1.8 a day) and the nines to
  84 distinct (67 spent), so the next walls are glue and 9s together. Several days fall
  back to the same layout three times in a row (`glue-1` on days 16 to 18, `big-3` on
  days 22 to 24) because the builder tries the rotation's next layout only after one
  fails. That is what a supply-aware picker is for (not built, see the card). A shorter
  cooldown on four-letter answers alone (20 days, a number only, the 90-day rule stands)
  still stops at day 25. The committed playset keeps eight days (the tool's default of
  `--days 8`).
- They are fitted to this bank, so their solves are controls, not a fill rate. A
  different bank, or a cooldown that bites on the nine- and ten-letter names, will move
  the budget. A daily under a 90-day cooldown still needs about 1,000 distinct answers
  at ten a day.
- Word ladders. Few, long answers with about 24% of cells checked (21% to 26% across the
  fourteen layouts, 24% overall, against 27% in the old seven) are a long run of rungs
  joined by single crossings: the solver gets less from the crossings and leans on the
  clue, which for a long name is the word game's best case and for a plain word its
  worst (the plain-word rule). The shapes read as a lattice of long rows with a few
  verticals, the 10x13 spines with an 11 to 13 letter answer down the middle. They are
  playable but do not feel like a classic crossword. Cold-solving a built puzzle with
  its crossings is the check to run before one is released, and has not been done here.
- Phone: cells are 31.5px on the 10-wide shapes and 35px on the 9-wide ones at 390px,
  the grid and the active clue are on screen together, the controls sit below the fold
  on the 13-tall shapes. `pnpm test:browser` runs the layout and accessibility checks at
  320, 390, 768, 1280 and 844 wide, in Chromium, Firefox and WebKit, on all eight
  puzzles, 117 passing (after `pnpm prototype:build`, the served page is a build). Its
  typing tests now find their down answer in the first puzzle instead of naming one, so
  they follow the playset.
- The twin rule (`twinConflicts`, passed to the fill as `conflicts`) keeps two answers
  out of one puzzle when one is spelt out in the other's clue, hint or fact, they are
  cited from the same row, or one is the head or tail of the other (NOVA, FROSTNOVA). It
  over-excludes a little. The editor's twin groups that these do not catch are still
  prose in `docs/seed-selection.md`.
