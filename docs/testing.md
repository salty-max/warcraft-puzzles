# Testing and maintenance

`pnpm check` is the single local and CI entry point. It runs:

1. Prettier checks, including data and documentation.
2. ESLint with type-aware rules and zero warnings.
3. TypeScript strict checking, including unchecked-index and optional-field checks.
4. Vitest with coverage thresholds, negative cases and deterministic property tests.
5. Structural and semantic research-content validation for every committed triad.
6. A check that the generated editorial report matches its inputs.
7. A deterministic replay and freshness check of the seed fill benchmark.

Content-engine coverage gates are 95% for statements/lines/functions and 90% for
branches. These thresholds are regression guards, not evidence that the content is
correct or every future feature is tested. Source query failure, stale source reviews,
post-Wrath facts, missing hint evidence, duplicate IDs, explicit answer leaks and edited
approvals all have deliberate failure tests. Property tests exercise spelling and
enumeration across generated valid inputs with a fixed seed, so a failure is
reproducible.

Coverage now includes the crossword domain rules and benchmark/report core as well.
Layout tests cover numbering, reciprocal crossings, black squares, connectivity, short
runs and malformed shapes. Fill tests cover independent solution validation, length
shortages, crossing contradictions, aliases, input-order determinism and node/time
limits. Deterministic property tests compare the solver against independent exhaustive
enumeration on small synthetic banks and recover generated valid squares. Multi-word
regression covers all eight cells and retained identity of KIRINTOR.

Benchmark tests replay all committed layouts, exercise successful synthetic exports,
preserve triad display/clue/hint data, reject stale/invalid inputs and verify that
checking does not rewrite measured artifacts. Full seed runs never auto-approve content.
Machine timings are observations outside the deterministic CI contract. See
[the engine guide](grid-engine.md) for the exact search and diagnostic limits.

The full 100-entry seed is checked in the test suite without an external database. An
optional source-replay command checks the private research input separately. No tests
are silently skipped because an external source is missing. The normal CI workflow must
be runnable by a new contributor with the repository alone.

Multi-word regression cases include three-word names and possessives, with spaces
removed only in the grid. Report tests distinguish total answer length from the longest
component word. The SQLite fixture exercises prose and structured-name locators, and
malformed name fields fail verification. Overlap reports are tested for stable ordering
so the most heavily reused passages appear first.

## CI and dependencies

The Checks workflow runs the same command on Ubuntu Linux, matching the server's
operating-system family. Browser coverage will exercise Chromium, Firefox and WebKit
when the player exists. Real iOS Safari and Android keyboard checks remain separate
release checks; Linux WebKit alone does not prove iPhone compatibility. Actions are
pinned to verified commit SHAs, token permissions are read-only and the job has a
timeout. Coverage, the editorial report and the fill benchmark are saved as artifacts. A
separate `pnpm check:security` audit includes development dependencies and fails on
moderate-or-higher advisories.

Dependencies and the package manager are pinned. Installs use the frozen lockfile, a
minimum package release age and strict peer compatibility. Dependabot proposes weekly
package and action updates. Review them through the full checks instead of silently
following latest releases. TypeScript is pinned to 6.0.3 because the current type-aware
ESLint parser supports versions below 6.1.0. Upgrading to the newer compiler before its
tooling supports it would undermine reliability.

The workspace overrides transitive `minimatch` to 11.0.1 to address
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Remove the
override when the lint tooling naturally resolves a patched compatible version, after
the full checks pass. Do not suppress the advisory to make the audit green.

Remote CI has not run until the repository is hosted and pushed. After creating the
remote, enable required status checks, disallow force pushes to `main` and verify a
deliberately failing pull request cannot merge. These are repository settings, not
guarantees a YAML file can provide.

## Application gates to add with implementation

Responsiveness starts with the first playable slice. Its browser tests must exercise
320×568, 390×844, 768×1024 and 1280×800 viewports, with useful visual snapshots,
overflow checks and visible active-clue/input states. Verify short landscape heights,
zoom and the phone keyboard on real devices as well. Do not postpone phone/tablet
behavior until after a desktop-only implementation ships.

Before the player becomes public, require tests for grid validity, player state, save
migrations, hint accounting, source/era eligibility, midnight release/cache rollover and
editor authorization. Add PostgreSQL integration tests, production build checks,
Playwright journeys in Chromium/Firefox/WebKit, accessibility scans and visual
regression coverage when the corresponding application exists.

Real-phone keyboard testing, screen-reader assessment, clue fairness, source licensing
review and backup/restore drills remain explicit human/release checks. An automated
green result cannot replace them.

The [progression design](progression-design.md) lists future reward and persistence
invariants, including duplicate claims, concurrent purchases, UTC rollover, offline sync
and assisted solves. No progression engine or tests for it exist yet. Add those checks
with each implemented feature rather than treating the design as test coverage.
