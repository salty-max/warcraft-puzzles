# Warcraft crossword: production plan

Date: 1 November 2026. Status: editorial foundation started in this repository; no
player application or new services provisioned. The owner confirmed an existing Vercel
Pro plan. Working project description only; the public name and domain are still open.

This plan supersedes the earlier crossword recommendations kept in the family workspace
at `ideas/crossword.md`. That document and `ideas/crossword-data/` remain records of the
earlier experiments. Their failure to fill a few grids from a name-heavy word list does
not establish that dense Warcraft crosswords are impossible.

## 1. The product we are building

A polished browser crossword with a new puzzle every day. Every clue has a meaningful
connection to Warcraft. Answers may be Warcraft names or ordinary English words: the
user's example is **FATHER**, clued by Grommash's relationship to Garrosh. That example
establishes the editorial approach; its supporting reference still needs to be recorded
before publication.

The first release is English and covers **Warcraft history through the end of Wrath of
the Lich King**, as explicitly chosen by the user on 1 November. Exclude Cataclysm and
later events, characters introduced later, and later revelations used to answer earlier
mysteries. Record each clue's earliest supporting era and reject later material during
review. Pre-WoW Warcraft history is included. An event's historical date alone does not
make a later retcon eligible.

The site should feel like a contemporary puzzle publication with a Warcraft identity:
excellent typography, an immediate route into today's puzzle, responsive controls and an
unobtrusive fantasy atmosphere. It should be credible as a public product and as a
portfolio case study.

The eventual collection of games informs navigation and routing. Crossword is the only
game implemented in this project phase. Give it a game-specific module and a small
shared shell; build shared abstractions when a second game actually needs them.

### First public release

- One reviewed daily crossword, identical for everyone on the same UTC date.
- Dense blocked grid, numbered Across and Down clues, fully checked letters.
- Today's puzzle, released-puzzle archive, instructions and an example puzzle.
- Keyboard and touch play, undo/redo, pencil mode, check/reveal controls.
- Automatic local saving, resume, local statistics and a spoiler-free share.
- Optional timer; assistance is recorded honestly without punishing learning.
- A post-solve explanation of the answers and their Warcraft connections.
- Installable web app; downloaded puzzles remain playable offline.
- A protected editorial workspace to review clues, compose grids and schedule
  publication, with source references and revision history.
- Public project/about page and a documented portfolio case study.

Player accounts, cross-device synchronization, competitive leaderboards, multiplayer,
payments, other games and translated puzzles follow demonstrated demand. The data
contracts carry locale and edition now, but a French crossword will require its own fill
and authored clues.

## 2. First prove the puzzles

The first investment is a small complete content experiment, not an attempt to enumerate
every possible Warcraft-related English word.

### Step A: define the editorial contract and approve 100 seed entries

Each answer needs at least one usable clue and a traceable supporting fact. Sample
names, relationships, occupations, ranks, materials, weapons, spells, creatures, places,
actions and ordinary descriptive words. Include short answers deliberately; a bank
dominated by long proper names repeats the previous experiment's weakness.

Agree on rules for abbreviation, inflection, possessives, multiword answers, apostrophes
and British prose versus the game's official English names. Default: A–Z grid, minimum
answer length three, spaces and apostrophes removed only in the grid, original spelling
retained in display metadata. Enumerations preserve word lengths where helpful. Ban
obscure dictionary scraps, debug strings and words with only a contrived Warcraft
connection.

### Step B: expand to an experimental 500–1,000 approved answers

This is a working sample size, not a promised sufficient vocabulary. Extract candidates
from `wow-data`, attach evidence, draft clues and review them. Track word lengths and
letter patterns, source/era coverage, familiarity and clue difficulty. Multiple clues
may reference the same answer.

### Step C: run reproducible fill experiments

Test a small library of valid 5×5, 7×7 and 9×9 blocked layouts. Compare the expanded,
clue-backed bank with the previous name-heavy baseline using the same layouts, seed
lists, node limits and time budgets. Keep the full report, including unsuccessful fills.
Do not add unrestricted dictionary filler to make the success rate look better.

Measure successful fills per layout, search time, answer quality, proper-name share,
repeat concentration, and which missing short words constrain the search. Mathematical
fill is necessary; a filled grid with miserable answers still fails editorial review.
Have the editor rank results without seeing the generator's scores when practical.

Choose a default size from the results and phone testing. Aim for a compact daily taking
roughly five to ten minutes, explicitly a hypothesis until playtested. Prefer fully
checked letters, connected white cells and no two-letter answers. Rotational symmetry is
a preference, not a reason to accept poor vocabulary. A sparse criss-cross is an
alternative product choice if dense grids remain unsatisfactory, not an automatic
fallback.

### Step D: finish and playtest seven puzzles

Review every clue, solve the complete grids cold, then test with several players whose
Warcraft knowledge differs. Record solve time, hint usage, unfair answers, confusing
input and the editor's actual production time.

**Exit criterion:** seven enjoyable, fully reviewed dense puzzles; a measured route to
producing more; a selected grid format; and a report identifying remaining vocabulary
gaps. If this fails, improve the bank or grid approach before committing to a daily
release.

## 3. The content system

### Evidence and extraction

Use the existing SQLite databases as read-only research inputs. Never ship the complete
databases to visitors or couple the live app to a sibling checkout's filesystem. Record
the source versions and database checksum used by each extraction run.

The inspected Classic snapshot has 14,999 English quest-text rows, 5,059 gossip rows and
4,476 gossip-page rows. These are text rows, not distinct facts or ready-made clues. Its
dedicated `npc_line` table has only 15 English rows, so that table is not a large
quotation corpus. TBC/Wrath coverage needs a separate audit and eligible sources before
we claim full-era coverage.

Use two candidate pipelines:

1. **Structured facts:** entity names, quest objectives/rewards, vendors, creature types
   and other explicit database relationships.
2. **Facts in prose:** family relationships, motives, events and descriptions extracted
   from quests, books and dialogue. Store a precise supporting passage and locator.
   Suggested facts remain unapproved until reviewed.

AI may propose facts and clue wording from supplied evidence. It never approves factual
accuracy, sources its own unsupported recollection, or generates today's puzzle on a
visitor's request. Published wording is ours; source extracts remain research material.
Check the actual licenses and permitted redistribution for selected sources before
public export. The database's source table already distinguishes licenses. Exclude
opt-in player records and personal information from the content pipeline by default.

### Answer eligibility and difficulty

The database is a research catalogue, not the answer bank. Retrieve structured names and
facts with their provenance, then admit answers through an editorial recognisability
check. An obscure exact quest title or ordinary weapon name usually belongs outside the
playable bank. Calling it "hard" does not make it a fair answer. This rule reflects the
user's clarification on 1 November.

| Subject                                        | Default editorial scope                                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Creature types, peoples and races              | Familiar world vocabulary; include ordinary category words with specific supported Warcraft clues                                |
| Characters and NPCs                            | Major lore figures, prominent leaders, memorable bosses and widely recognised quest characters                                   |
| Rares                                          | Manual exceptions for recognisable encounters; the database's rare rank is not a reason to include a name                        |
| Places and zones                               | Recognisable zones, cities, dungeons, raids and prominent landmarks; minor subzones need a strong justification                  |
| Factions and organisations                     | Established, recognisable groups and supported roles/titles within them                                                          |
| Events and history                             | Major eligible conflicts and events; smaller incidents can support clues for ordinary words without requiring their exact titles |
| Quests                                         | Research evidence by default; exact titles are exceptions requiring strong recognition and a fair clue                           |
| Weapons, items and objects                     | Iconic named examples only as proper-name answers; ordinary gear and random loot names are excluded                              |
| Classes, professions, magic and materials      | Familiar terms supported by eligible facts; individual ability/recipe names require the same recognition check                   |
| Relationships, roles, actions and descriptions | A substantial source of ordinary English answers, each tied to a clear eligible Warcraft fact                                    |

These categories label research contexts, not automatic inclusion rules. Do not pad the
bank to meet quotas or admit an obscure answer because the generator needs its letters.
A quest or weapon may provide evidence for a clue whose answer is a familiar word. That
clue must still contain enough context to work without memorising the exact quest text
or item tooltip.

Reject debug/internal names, arbitrary levelled creature variants, ordinary loot names,
invented shortened names and unsupported descriptions. Retain long names as research
references even when they do not fit the current grid; never truncate a name solely to
make it fit.

For each candidate ask: would a player with broad Warcraft knowledge through Wrath
recognise it, or have a reasonable route to deducing it from this clue and its
crossings? If success mainly requires remembering a one-off database label, reject it.
Distinguish genuine recognition from the editor's own familiarity; borderline entries
need cold playtesting. Faction/class-specific knowledge is tagged so a grid does not
quietly assume everyone played one particular route.

Difficulty applies primarily to the **clue**, with answer familiarity stored separately.
Rate familiarity, factual specificity, clue directness and spelling burden during
review. Start with three editorial tiers:

- **Easy:** familiar subject, direct wording and a readily recoverable answer.
- **Medium:** an eligible but more specific fact, or a fair indirect clue for a familiar
  answer. Crossings should provide a useful route to the solution.
- **Hard:** deeper eligible knowledge or more demanding inference, with clear wording
  and strong crossing support. Obscure database trivia stays excluded.

Do not use game level, item rarity, raid tier or database occurrence count as the
difficulty label. Such metadata can help identify candidates but does not measure what
players remember. In particular, a rare can be well known and a normal NPC can be
completely forgettable.

Grid difficulty also depends on how clues cross. Avoid placing unfamiliar proper names
against one another at a letter players cannot reasonably infer. Provide easy footholds
across the board, vary subject coverage, and inspect the actual crossing pattern before
assigning a puzzle-level label. Begin with a mixed daily rather than promising a weekday
difficulty ladder.

The first seven-puzzle trial calibrates these judgments using unassisted completion,
assistance requests, crossing support needed and participant feedback. Record broad
participant experience, including faction/class background, so one expert's solve does
not define "easy". Treat timings as supporting evidence because interruptions and typing
speed affect them. A small trial provides directional findings, not precise population
estimates. Unexpectedly poor solves trigger a review of clue fairness and answer
eligibility before merely raising the difficulty label.

### Core records

| Record          | Required information                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Answer          | Stable ID, grid form, display form, enumeration, locale, aliases, length, familiarity, inclusion rationale, faction/class exposure tags, review status |
| Evidence        | Source/version, entity IDs or text locator, supporting extract, checksum, eligible era, attribution/export classification                              |
| Fact            | Explicit assertion, linked evidence, earliest supported era, reviewer and decision                                                                     |
| Clue            | Answer ID, original wording, linked facts, difficulty, ambiguity notes, revision and review status                                                     |
| Grid            | Layout, algorithm version, seed, filled slots, validation and quality report                                                                           |
| Puzzle revision | Exact grid and clue revisions, edition, locale, content hash, author/editor, status                                                                    |
| Release         | Game, edition, locale, UTC release date, puzzle revision, stable puzzle number, publication history                                                    |
| Editorial event | Actor, timestamp, action, affected revision, before/after reference                                                                                    |
| Local play      | Puzzle/revision ID, letters, pencil marks, assistance events, timer state and completion                                                               |

Different spellings or facts may share a grid form. Store their senses and clues
distinctly; a single grid must not repeat that normalized answer. Published puzzles pin
exact answer/clue revisions, so editing the bank cannot silently change a released
puzzle.

### Editorial workflow

Candidate → evidence checked → clue drafted → clue reviewed → grid composed → puzzle
reviewed → scheduled → released.

One owner may perform multiple roles, but the final cold solve is a separate review
pass. Publication requires approved evidence and clues, an eligible era, a valid grid
and an explicit editorial release action. Daily scheduling publishes only already
approved content.

The editor needs source previews, length/pattern search, clue alternatives, answer
locks, alternate fills, repeat warnings, a live puzzle preview and a calendar showing
the buffer. Start with these useful tools; avoid a generic CMS project. When bank edits
conflict, require an explicit revision choice rather than overwriting another edit
silently.

### How many dailies can we sustain?

Report capacity from actual scheduled grids and editorial time. Unique word count
divided by entries per puzzle is not a useful expiry date: answers can return with new
clues.

Start with adjustable scheduling targets: common answers preferably separated by at
least 30 days, distinctive names by 60, identical clue wording by 180. These are
hypotheses and soft warnings during experimentation; report any exceptions and tune them
from measured feasibility and player feedback. Prevent repeated whole grids and
concentrated reuse of the same lore facts.

Simulate 30, 90 and 365 days. Report valid grids, repetition distribution, eligible clue
inventory, editorial hours and failure reasons. For illustration only, a format
averaging 18 entries needs 540 clue placements for 30 days and 6,570 for a year. Those
are placements, not necessarily unique answers or unique clue texts. Measure the real
slot average before forecasting.

## 4. Recommended stack

Select supported stable versions, pin the dependency graph and update it deliberately.
Modernity means capable tooling and maintainable choices; experimental features need a
specific benefit and an isolated adoption path.

| Layer           | Decision                                                                  | Reason                                                                                  |
| --------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Web framework   | Next.js 16.4 App Router, latest patched compatible release                | Public pages, server rendering, metadata and editor/server endpoints in one application |
| UI              | React 19.3, strict TypeScript                                             | Rich keyboard interaction with explicit state and typed boundaries                      |
| Runtime/tooling | Node.js 26 LTS, pnpm workspaces                                           | Supported server runtime and reproducible dependency management                         |
| Styling         | Tailwind CSS 4.3, CSS variables and original design tokens                | Consistent responsive design without a heavy visual theme                               |
| UI primitives   | Radix-based shadcn/ui components, selected individually                   | Accessible foundations for dialogs, menus and forms; custom crossword controls          |
| Contracts       | Zod at API, file-import, environment and persistence boundaries           | Reject malformed data and support schema-versioned saved games                          |
| Database        | PostgreSQL on Neon; Drizzle ORM and versioned SQL migrations              | Durable editorial records, release transactions, portable SQL and typed queries         |
| Editor identity | Better Auth with GitHub OAuth and a server-side account-ID allowlist      | Protected owner/editor workflow; visitors play without signing in                       |
| Player storage  | IndexedDB through Dexie, with versioned migrations                        | Reliable local resume, statistics and offline state                                     |
| Domain engine   | Framework-independent TypeScript packages                                 | Reusable validation, solver state and fill logic, separately testable                   |
| Generation      | Offline TypeScript CLI, worker threads only when profiling justifies them | Reproducible fills without blocking web requests                                        |
| Testing         | Vitest, Testing Library, fast-check, Playwright and axe                   | Algorithm invariants, interaction, browser behavior and accessibility checks            |
| CI/CD           | GitHub Actions and Vercel preview/production environments                 | Reviewable changes, isolated previews and controlled releases                           |
| Operations      | Sentry, structured server logs, uptime and publication checks             | Detect broken play, failed requests and an empty or incorrect daily release             |

Use React reducer-based state for the first solver; keep effects and persistence outside
the pure transition functions. Add a state library only if measured complexity warrants
it. Use server-rendered reads and mutations for editorial CRUD; add client query caching
where a specific editor workflow benefits. A second REST service, GraphQL layer, message
broker, vector database and microservices are unnecessary for these requirements.

Current primary references checked on 1 November 2026:
[Next.js 16.4](https://nextjs.org/blog/next-16-4),
[React versions](https://react.dev/versions),
[Node release policy](https://github.com/nodejs/Release),
[Vercel Node support](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions),
[Tailwind documentation](https://tailwindcss.com/docs),
[Drizzle migrations](https://orm.drizzle.team/docs/migrations),
[Better Auth GitHub provider](https://better-auth.com/docs/authentication/github), and
[Dexie](https://dexie.org/docs).

Recheck exact compatible versions when scaffolding. Next.js has announced a
[3 November security release](https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026);
apply the relevant stable patches before a public deployment after that date.

## 5. Architecture and repository

Create a dedicated repository under `wow-addons` when implementation begins. Use a
neutral local folder such as `warcraft-puzzles`; the eventual brand can change
independently. The existing `geoguessr` remains a separate project unless we explicitly
choose to integrate it later.

```text
apps/web/                 Next.js public site and protected editor
packages/crossword/       Grid model, validators, player state transitions
packages/content/         Evidence, answer, clue and release contracts
packages/generator/       Layout search, fill solver and quality scoring
packages/db/              Drizzle schema, migrations and repository functions
tools/                    Import, extraction, generation and schedule simulation
fixtures/                 Small reviewed examples, synthetic test data
docs/                     Architecture decisions, editorial rules, runbooks, case study
```

Use pnpm workspace scripts initially. Add a task cache only if build/test time justifies
it. Keep `wow-data` ingestion behind an explicit input path and versioned export
contract. Normal web development and CI run on small fixtures; they must not need the
local 258 MB source database, the WoW client or a sibling repository. Research imports
can use Python's SQLite library where convenient; the production runtime remains Node
and PostgreSQL.

The flow is: pinned research sources → candidate facts/answers → editorial approval →
offline fill → reviewed immutable puzzle revision → scheduled release → cached public
puzzle → browser-local play.

### Public and private boundaries

- Public routes serve only released revisions and a deliberately public demo. Neither
  search, archive queries, prefetching nor static assets reveal future puzzles or the
  private clue bank.
- Every editor read and mutation checks session and role on the server. Hidden buttons
  and route middleware are not authorization. Preview uses separate credentials and a
  separate database from production.
- Released grids may include their solutions for responsive checking and offline play. A
  determined visitor can inspect them. Local results are therefore personal records,
  with no claim of competitive integrity.
- Public payloads expose approved explanations and safe references; they do not contain
  raw source corpora or private editorial notes.

### Daily releases and cache behavior

Resolve today's release from the server's UTC date. Use a unique database constraint on
game/edition/locale/release date and a transactional schedule operation. A fixed UTC
calendar makes shares and daily numbers consistent. Show the next-release time in the
visitor's local time.

Future puzzles are prepared in advance; becoming today's puzzle requires no daily
generation job. Cache immutable dated revisions for a long time. Cache the today lookup
briefly and never past its UTC day boundary. Test CDN cache, framework cache and
service-worker cache together around midnight. Offline play can resume a downloaded
puzzle; it cannot promise a new puzzle without connectivity.

If the daily release is missing, keep the archive available and show an honest
unavailable state. Alert the owner. Do not silently repeat yesterday's puzzle under a
new number. Monitor the buffer and scheduled-release validity in CI and operational
checks.

Corrections create a new revision and an audit event. Preserve old released revisions
for existing saves. A clue wording fix can preserve progress; a structural replacement
needs an explicit recovery choice. Test revision and save migrations before publishing
corrections.

## 6. The playing experience and visual design

Create an original editorial identity: restrained ink/ivory or slate tones, a legible
text face, distinctive headings, clear focus/selection colours and a small
Warcraft-inspired accent system. Test both light and dark modes. Use self-hosted,
appropriately licensed fonts and artwork. Keep decoration away from cells and clues. The
homepage should make today's puzzle visible immediately, with the archive and project
explanation secondary.

### Responsive from the first playable screen

Responsive design is part of the initial implementation, explicitly confirmed by the
user on 1 November. Design and review the phone, tablet and desktop states together. The
first playable slice cannot pass its gate with only a desktop layout.

- Start with a stacked phone layout. Use a split grid/clue layout only when there is
  sufficient usable space. Breakpoints follow the content rather than device names. Use
  fluid layout and typography within those constraints.
- Test at 320×568, 390×844, 768×1024 and 1280×800 CSS pixels from the first player
  implementation. Check portrait and landscape behavior and intermediate widths. The
  page must not develop accidental horizontal overflow.
- Keep the active clue and editable entry usable with a phone keyboard open. Account for
  visual-viewport changes, safe areas and short available heights. Collapsing navigation
  or an accessible entry-focused view is preferable to obscuring the input. Do not
  assume a fixed desktop viewport height.
- Make grid letters and numbering readable, cell selection clear and controls
  comfortable to tap. Prefer 44 px action controls. Validate cell targets against
  accessibility rules for the selected grid and available width.
- Preserve zoom and keyboard navigation. Offer a usable clue/entry alternative when an
  enlarged spatial grid cannot fit. Neither hover nor drag is required for essential
  play.
- Add viewport assertions and representative visual snapshots to the first player tests.
  Chromium/Firefox/WebKit coverage and real-phone keyboard checks verify different
  risks; an emulated narrow viewport does not replace either.

Desktop: grid beside Across/Down lists, active clue clearly anchored, progress and help
within reach. Phone: grid and active clue remain visible while typing; test actual iOS
Safari and Android Chrome keyboard resizing. Offer a compact keyboard if it improves
usability without trapping native input. Use semantic DOM, not a canvas-only board.

Define and test cell selection, direction toggling, arrows, Tab/Shift+Tab, Space,
Backspace/Delete, entry movement, paste and undo/redo. Handle composed input and invalid
characters predictably. No autofocus that unexpectedly opens a phone keyboard. Store
active selection and accessibility preferences separately from puzzle answers.

Checking/revealing a letter or answer records assistance in the result. Completing with
assistance remains a completion; local statistics distinguish it from an unassisted
solve. Rechecking or replaying cannot create duplicate daily completions. Timer
pause/background behavior must be specified and tested; avoid publishing speed rankings
from untrusted local clocks.

Save changes promptly, restore after a crash/reload, and handle storage quota or
disabled persistence visibly. Support a versioned local export/import so people can back
up their progress. Explain that clearing browser storage can remove it. Multiple tabs
must not silently replace newer progress with an old save; synchronize writes or show an
explicit conflict.

Accessibility target: WCAG 2.2 AA. Include keyboard-only completion, visible focus,
accessible cell/clue announcements, an alternative clue/entry view, non-colour status
cues, reduced motion, zoom/reflow and usable touch targets. Prefer 44 px controls;
validate dense cell sizes on the chosen phone layouts against the actual
[WCAG target-size rules](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
Automated scans supplement manual screen-reader and keyboard testing;
[Playwright documents that limit explicitly](https://playwright.dev/docs/accessibility-testing).

## 7. Production quality and operational requirements

### Tests and release gates

- Pure engine tests: crossings, numbering, connected layouts, fully checked letters,
  duplicate answers, normalization and legal player transitions.
- Property-based tests: generated layouts/fills validate; arbitrary action sequences
  preserve grid invariants; save round-trips preserve play state.
- Content checks: every published clue has approved eligible evidence; exact revisions
  exist; no draft/future content escapes; schedule constraints hold.
- PostgreSQL integration tests: migrations, authorization, concurrent schedule writes,
  revision pinning and transactional publication.
- Browser tests on Chromium, Firefox and WebKit: typing, touch selection, hints,
  completion, resume, offline loading, sharing, export/import and UTC rollover. Exercise
  mobile layouts and real-device keyboards separately.
- Accessibility scans and manual assistive-technology checks; visual regression coverage
  for the player, editor and important error/empty states.
- Pull-request CI: format/lint, strict types, meaningful tests, production build,
  content validation, dependency/security checks and a reviewable preview. Required
  checks block production release.

Set performance budgets before implementation. Initial targets: LCP ≤2.5 s, INP ≤200 ms
and CLS ≤0.1 at the 75th percentile when field traffic permits, following
[Core Web Vitals](https://web.dev/articles/vitals). Until then, record repeatable mobile
lab conditions and input-response measurements. Keep the player's client bundle separate
from editor and generator code; investigate bundle changes in CI. Record a measured size
budget after the first vertical slice rather than inventing a precise number now.

### Security, privacy and recovery

Use secure session cookies, provider-supported OAuth state/PKCE protections, trusted
origins, server authorization, input limits, parameterized database queries, security
headers and an appropriate CSP. Rate-limit expensive and authentication endpoints with a
deployment-appropriate shared mechanism. Never expose research imports, secrets or
administrative exports to clients.

Keep telemetry minimal. Record failures and aggregate game events without player-entered
letters, source extracts or personal data in logs. Launch without advertising trackers
or session replay. Review any later analytics and consent requirements when selecting
the actual service and configuration.

Separate local, preview and production data. Apply reviewed migrations through a
controlled release step, not automatically from every preview. Use additive migrations
for changes that must coexist with an older deployment. Back up editorial content and
releases outside the primary database and perform a documented restore drill. Define a
provisional 24-hour maximum content-loss window and a four-hour recovery target, then
verify them in that drill.

Runbooks cover deploy/revert, database restore, missing daily release, clue correction,
compromised editor credentials and dependency security patches. Application rollback
must remain compatible with the database schema.

### Hosting and budget

Recommended target: Vercel for the web application, Neon PostgreSQL in a nearby region,
GitHub for source/CI, Sentry for errors. Verify service regions, retention, spend
controls and backup entitlements at provisioning time.

Vercel currently lists [Pro at $20/month](https://vercel.com/pricing), before applicable
taxes and additional usage. Its
[Hobby plan is for personal, non-commercial use](https://vercel.com/docs/plans/hobby).
The owner already has Vercel Pro, confirmed on 1 November 2026; use that existing plan
rather than buying another subscription. Record database, monitoring, domain and usage
allowances separately before enabling paid services. Set spend alerts and available hard
limits; no paid service is purchased by this plan.

## 8. Delivery milestones

| Milestone                        | Deliverable                                                                                        | Completion gate                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 0. Editorial foundation          | Era policy, answer/fact/clue schema, normalization rules, 100 reviewed seed entries                | Every entry has an original fair clue and eligible evidence                                                |
| 1. Feasibility                   | Expanded bank, reproducible benchmark, seven finished puzzles, capacity report                     | Dense format is enjoyable and production effort is measured                                                |
| 2. Foundation and vertical slice | Repository, CI, data migrations, one designed puzzle playable from published data                  | Phone/tablet/desktop layouts, keyboard/touch play, keyboard-open behavior and saved resume work end to end |
| 3. Editorial production          | Protected editor, imports, fill controls, review states, versioning and calendar                   | Owner can produce, review, schedule and correct a puzzle without editing application code                  |
| 4. Public beta                   | Daily/dated routes, archive, hints, local stats, sharing, offline, accessibility and observability | At least 14 reviewed puzzles, critical journeys tested, diverse playtest feedback addressed                |
| 5. Portfolio/public release      | Content buffer, documented operations, public project narrative and final polish                   | Full launch criteria below pass                                                                            |

Milestone 0 is the immediate next implementation task. Content work and the app's
foundation may progress together after the vocabulary/grid experiment has established a
credible format. Do not promise a launch date before that experiment measures the
editorial bottleneck.

### Public launch criteria

- At least 30 reviewed daily puzzles ready, preferably 60 if production is sustainable,
  plus a separately identified demo. All pass source/era review.
- A simulation shows the measured bank can support the near-term schedule without
  unacceptable repetition. No claim of a year's supply without a completed corresponding
  run and editorial review.
- Critical browser, persistence, midnight-release and authorization tests pass.
- Manual keyboard/screen-reader checks and real-phone input checks completed.
- Performance measured against the agreed budgets; remaining deviations documented and
  resolved or explicitly accepted with a reason.
- Restore and rollback drills completed; alerts for downtime, publication failures and a
  shrinking content buffer verified.
- Credits, selected-source redistribution review, privacy information and a clear
  fan-project/non-affiliation statement complete. No implied Blizzard endorsement or
  unlicensed asset bundle in the public repository.
- A new contributor can run the demo and tests from the README without private data,
  production credentials or access to the owner's machine.

## 9. What makes this a portfolio project

Ship a concise case study with screenshots and a playable permanent demo. Explain the
actual problem, the editorial vocabulary insight, grid-search tradeoffs and the player
experience. Include architecture decisions, source provenance design, reproducible
benchmark results, accessibility findings, performance measurements and the production
workflow. Publish actual results, including failed approaches, rather than unsupported
scale or quality claims.

The strongest evidence is an excellent puzzle someone can finish on their phone, a
dependable daily release, and a clear explanation of how we built and operate both.

## 10. Decisions still open

- Public name, domain and final visual identity.
- Default grid size and target difficulty, decided by the seven-puzzle trial.
- Specific TBC/Wrath source additions and their coverage/export eligibility.
- Launch hosting tier, operating budget and owner/editor account IDs.
- Desired archive launch depth and whether exact clue repeats are ever allowed.

These choices do not prevent the first 100-entry editorial experiment.
