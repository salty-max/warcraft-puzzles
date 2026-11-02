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

The eight `bank-l1` to `bank-l8` layouts (`content/benchmarks/layouts.json`: 9x11, 9x13,
10x12, nine to eleven answers) replace them. The method, a throwaway annealer kept out
of the repository, not a committed generator:

- **The length mix is a hard input, derived from supply.** Supply per length, divided by
  90 days: 5 letters 49 answers (0.5 a day), 6: 55 (0.6), 7: 76 (0.8), 8: 101 (1.1), 9:
  151 (1.7), 10: 89 (1.0), 11: 53 (0.6), 12: 39 (0.4), 3 and 4 letters 16 and 65. The
  budget a layout must meet, or the cell is rejected outright (a penalty of 100 against
  a cost of 0 to 30): at most one five-letter slot, two to four slots of three or four
  letters (glue, the relaxed plain-word rule), at most two six-letter slots, at most one
  of eleven or more, the rest of seven to ten, nine to thirteen slots in all. The
  earlier "3-4 letter slots did not help" only showed that an annealer which was never
  forced to use them did not.
- **Moves and cost.** Start from a valid shape, flip one or two cells, keep it only if
  it compiles (`compilePartiallyCheckedLayout`), passes `checkingFloorIssues` and keeps
  the budget. The cost then adds the real filler on the live bank (4,000 nodes, twin
  rule on) and, if that fills, four fixed random 65% samples of the bank (6 per sample
  that fails). Eight runs of ten minutes (four starting shapes, two seeds). Shapes that
  filled the full bank and all four samples were collected (about 19,000, mostly
  neighbours of each other).
- **Selection.** 300 of those, 6 samples each, then the best 30 on 24 other samples,
  then eight kept that differ by at least 14 cells.

What it showed, and what it can't:

- Robustness, each layout filled against 24 random 65% samples of the bank (a stand-in
  for answers locked out by the cooldown, which really removes the recent answers, not
  random ones). The old seven filled 0 to 11 of 24 (0% to 46%) on the samples the new
  ones were picked on, 0 to 11 of 24 on a fresh set. The new eight filled 23 or 24 of 24
  on the first set and 18 to 24 of 24 on the fresh one (75% to 100%). The first set
  selected them, so the fresh one is the number to quote. The samples are drawn with a
  mulberry32 generator seeded 12345 (the selection set) and 777777 (the fresh set), the
  annealer's four with 999, all over the live bank in file order at a 0.65 keep rate, a
  node limit of 10,000 and fill seed 11. The annealer's scripts are not in the
  repository, so these figures can be re-checked only by rewriting them.
- Rolling cooldown: `node tools/build-playset.ts --days 30` builds 17 puzzles in a row
  under the 90-day cooldown and day 18 has no fill (it built six and stopped at day 7
  before). The layouts repeat from day 9, which is fine for a build and not for a daily:
  a real rotation needs more layouts, or the bank to grow. The committed playset keeps
  eight days, one per layout (the tool's default of `--days 8`).
- The new layouts spend at most one five-letter answer (two have none), two to four glue
  answers (all four letters in practice, the annealer found no use for three) and the
  bulk at seven to nine letters. The bank's five-letter answers (49) are now needed at
  about 1 a day, against 0.5 supplied. The run stops at day 18, so something else (not
  measured here) runs dry first: check `lengthDeficits` and the dead ends before the
  next change.
- They are fitted to this bank, so their solves are controls, not a fill rate. A
  different bank, or a cooldown that bites on the nine- and ten-letter names, will move
  the budget. A daily under a 90-day cooldown still needs about 1,000 distinct answers
  at ten a day.
- Word ladders. Few, long answers with about 24% of cells checked (15 of 62 on a 10x12,
  against 27% in the old seven) are a long run of rungs joined by single crossings: the
  solver gets less from the crossings and leans on the clue, which for a long name is
  the word game's best case and for a plain word its worst (the plain-word rule). The
  shapes at 390px read as a lattice of long rows with a few verticals, the 9x13 with a
  twelve-letter spine. They are playable but do not feel like a classic crossword.
  Cold-solving a built puzzle with its crossings is the check to run before one is
  released.
- Phone: cells are 31.5px on the 10x12 shapes and 35px on the 9-wide ones at 390px, the
  grid and the active clue are on screen together, the controls sit below the fold on
  the 9x13. `pnpm test:browser` runs the layout and accessibility checks at 320, 390,
  768, 1280 and 844 wide, in Chromium, Firefox and WebKit, on all eight puzzles, 105
  passing. Its typing tests now find their down answer in the first puzzle instead of
  naming one, so they follow the playset.
- The twin rule (`twinConflicts`, passed to the fill as `conflicts`) keeps two answers
  out of one puzzle when one is spelt out in the other's clue, hint or fact, they are
  cited from the same row, or one is the head or tail of the other (NOVA, FROSTNOVA). It
  over-excludes a little. The editor's twin groups that these do not catch are still
  prose in `docs/seed-selection.md`.
