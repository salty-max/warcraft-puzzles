# Warcraft Puzzles

A Warcraft browser crossword, the daily first: partially checked grids (criss-cross),
every answer an answer-clue-hint triad sourced from the game's own text. Started by GPT
(Codex), moved out of `~/code/wow-addons` on 1 November 2026. The audit that set this
map up, its verdict and the build order:
`~/code/wow-addons/ideas/audit/warcraft-puzzles.md`.

Read this map, `README.md`, `docs/editorial.md` and `docs/testing.md` before changes
(GPT's first rule), then the role brief of the files you will touch (`docs/roles/`),
then the doc the task needs. `AGENTS.md` points here, so Codex reads the same rules.

## Commands

Node 26 and pnpm 11.18.0, as pinned.

| What                        | Command                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| everything, before a commit | `bun harness/q.ts check -- pnpm check` (stamps the tree)                                                           |
| install                     | `pnpm install --frozen-lockfile`, `pnpm test:browser:install` once                                                 |
| content                     | `pnpm content:check`, `pnpm content:report` (keeps `docs/seed-report.md` in step)                                  |
| sources                     | `pnpm content:verify-sources --database "$WOW_DATA_DB"`, `pnpm content:refresh --database …` (a deliberate update) |
| engine                      | `pnpm test`, `pnpm benchmark:run`, `pnpm benchmark:check`                                                          |
| the page                    | `pnpm prototype:dev` (http://127.0.0.1:4173/), `pnpm test:browser`                                                 |

`WOW_DATA_DB` is wow-data's Classic database, by default
`~/code/wow-addons/wow-data/.cache/db/classic.db` (the `.cache/classic.db` beside it is
an empty file). It comes only from wow-data's own build at its pins
(`~/code/wow-addons/wow-data/pins.json`), never a private copy. CI and a fresh clone
never need it: they read the committed `content/seed/evidence.json`.

## The rules (GPT's, kept)

- Scope: Warcraft lore disclosed through the end of Wrath, with no later retcons.
- Every playable entry is an answer-clue-hint triad with evidence for both prompts.
- Do not pad the answer bank with obscure quest titles, routine loot or minor NPCs.
- Answers come through `wow-data` (classic.db, forever.db) by id, exports or its
  read-only SQLite interface. Lore facts come from the allowed lore sources at a pinned
  revision (`docs/editorial.md`, "Lore research"). Normal CI needs neither a private
  database, a local absolute path nor the network.
- Research checks passing never auto-approve an entry or completed puzzle.
- Source changes invalidate evidence reviews. Wording changes invalidate approvals.
- Run `pnpm check` after changes. Do not weaken coverage thresholds to pass a change.
- Keep generated `docs/seed-report.md` synchronised with `pnpm content:report`.
- Use supported stable dependencies and preserve the frozen lockfile.
- New application behaviour needs meaningful automated checks and browser and
  accessibility verification. No placeholder or permanently skipped tests.
- Build the player mobile-first from its first screen. Phone, tablet and desktop
  layouts, touch input and phone-keyboard behaviour are acceptance criteria, not polish
  (the responsive contract in `docs/production-plan.md`).
- Deployment: the owner's existing Vercel Pro plan. No new subscription or hosting
  project without a reason and direction.

## The rules (added 1 November 2026)

- **A plain word needs a Warcraft clue.** An ordinary English answer keeps only a clue a
  player cannot solve without Warcraft (the audit: 81% of answers were plain words, and
  a blind solver got 98% from the definition alone). Weight new answers to Warcraft's
  own names. Since 2 November 2026 the cap and this rule do not bind 3-4 letter glue
  words, where a plain word is welcome if the clue reads as part of the game (a spell or
  phrase fill-in, an in-world role). Never quest trivia hung on a dictionary word.
- **The cooldown:** no answer back within 90 days, and then with a fresh clue. No source
  page twice in a week's puzzles.
- British English (honour, grey, colour), game names as the game spells them. Plain
  ASCII in content files. No semicolons in anything a player reads (clues, hints, facts,
  the page): two sentences, a comma, or a rewrite.
- Every claim in a clue or hint is a fact in the answer's research dossier, with its
  source and the date it was first disclosed (before 12 October 2010, patch 4.0.1).
  Clues are our own words, never a source's sentence, and never a spawn, drop or vendor.
  Older triads stand on wow-data excerpts until rewritten: their claims follow from the
  excerpt, checked by id with
  `bun ~/code/wow-addons/wow-data/bin/card.ts <npc|object|quest|item|place> <id>`.
- No other project's private files: wow-data's database by path, nothing read from the
  addons.

## Roles and the dispatch

Four roles, each a brief in `docs/roles/` and an agent in `.claude/agents/`: **content**
(the bank, clues, hints, the gates), **engine** (fill, validator, seed, cooldown,
benchmark), **front** (the player page, phone first), **back** (server-side serving when
a daily is real). No persistent leads: the dispatch (the user's main session, or a
dispatch session) opens one session per task with the role's brief. Opening and closing
a session is the `child` skill (`~/.claude/skills/child`), and its step 0 loads this
project's dispatch skill, `dispatch`, which picks the role, the lock and the brief. A
card's title starts with its role: `[content] Cut the padding`.

The build order: content first (cut, fix, grow toward 1,000 answers through the gates),
a go/no-go at 500 good answers, then front (the grid-typing redesign is done, see
`docs/design.md`), engine (seed test, cooldown, a daily builder), back (dated serving).

Files no role owns (`package.json`, the lockfile, `CLAUDE.md`, CI, `vitest.config.ts`,
`docs/testing.md`, `docs/production-plan.md`) belong to whichever card changes them, and
the reviewer looks harder at them.

**Models:** this repository's `.claude/settings.json` sets Sonnet, so every session
opened here runs on it. A plan the user must approve: `/model opus` for that session.
The `reviewer`, `architect` and `editor` pick Opus in their own frontmatter.

## Helpers and skills

In this repository's `.claude/`, so every session opened here finds them, called in the
foreground. The four role agents and the researcher write files (never commit, one
writer at a time), the others are read-only. The cold-solver gets its clues in the
prompt and no tools, never this repository.

| Helper                               | Model  | When                                                             |
| ------------------------------------ | ------ | ---------------------------------------------------------------- |
| `reviewer`                           | Opus   | every role, before each commit (the packet first)                |
| `architect`                          | Opus   | a plan, the same error twice, before a big change is called done |
| `editor`                             | Opus   | content, once per batch: voice, fairness, the bank's balance     |
| `researcher`                         | Sonnet | content: an answer's lore dossier from the wiki, sources pinned  |
| `fact-checker`                       | Sonnet | content: each changed triad against its rows by id               |
| `cold-solver`                        | Sonnet | content and releases: clues answered blind                       |
| `content`, `engine`, `front`, `back` | Sonnet | a role's task handed to a subagent                               |

Skills: `child` (the user's, opens and closes a session), with this repository's
`dispatch` as its addendum, `content-change`, `puzzle-release`, `fill-bench`.

## Docs

- `docs/editorial.md`: eligibility, hints, review and source updates
- `docs/testing.md`: the checks and their limits
- `docs/grid-engine.md`, `docs/fill-benchmark.md`: the engine and its benchmark
- `docs/production-plan.md`: the plan (its server stack waits for the bank's gate)
- `docs/progression-design.md`: streaks and the lorebook, not built
- `docs/pilot-report.md` and the per-puzzle reports: the seven old candidates, history

<!-- harness:start -->

## Harness

This project runs under a small harness (`harness.toml`, tools in `harness/`). The rules
below are checked by git hooks or by tools, so they are not advice.

- **One task, one session, one card.** A session's first write is its card:
  `bun harness/board.ts add <repo> "<title>" --repos <repo> --try "…" --committed "(none yet)" --left "…"`.
  It holds the repositories it names, and a commit by a Claude session is refused unless
  its running card names the repository (`board.ts held` says who got there first). Move
  the card at each stop
  (`board.ts set <id> --status waiting-test|waiting-review|ready-to-push|done`).
- **Checks go through q**: `bun harness/q.ts check -- <the check>`. One verdict line,
  the log in `.cache/logs/`, the tree stamped. A push is refused for a tree with no
  passing check. Never pipe a check into `tail`; anything long goes to a file.
- **The board is the lock.** A `held:` line means another card got there first: drop
  that repository from yours (`set <id> --repos …` without it) and go on with the rest,
  or commit what you have, `set <id> --on <holder>` and write nothing. A card whose
  session is gone still holds until the user moves it.
- **Review before the commit**: `bun harness/packet.ts <repo>` on the uncommitted files,
  the `reviewer` helper reads the packet, fix what it finds, then
  `bun harness/review.ts <repo> "<verdict>"`, then one commit. A push is refused for a
  change no review stands behind (docs are waived).
- **Commits**: Conventional Commits, lowercase subjects, no AI co-author or "generated
  with" line (the commit-msg hook refuses them).
- Ask before any push, release or deploy.
- Rules this project keeps beyond these: `CLAUDE.md`.

How sessions work together (behaviour: no hook checks these):

- **A new task asked in a session that has its own is opened as a child** (the `child`
  skill): tell the user its name and where to find it, write nothing for it here. A
  small follow-up of the same thread stays.
- **Questions go through the question tool** (`AskUserQuestion`, or `wrap_up`'s ask),
  the recommended answer first and marked "(Recommended)". Never a question buried in
  prose.
- **A go belongs to the session that asks it.** A child asks its own go in its own
  session and never pushes. Its opener pushes only on a go the user gave in the opener,
  or on the child's quote of the user's words with their scope (repository, sha range,
  push only). A push go never covers a deploy or a release: each is asked again.
- **Close a finished child yourself**: its work pushed (or dropped) and its card done,
  then `bun harness/session.ts check <local_id>` and archive it (desktop) or
  `session.ts close` (CLI). Never wait to be told. Never one that waits on the user,
  holds an open card or has a follow-up on its way.
- **Pick each child's model from its task**: the project's default for mechanical work
  from a written brief, a stronger model at higher effort for judgment (prose, voice,
  security, design, a plan the user must approve). Set it when the child starts (a plan
  child once its plan is approved) and say the choice in one line.
- **A problem found along the way gets fixed now**, under its own card, or handed to a
  new session at once. Never only mentioned in the report.
- **Review your own work before saying it is done**: read the diff, grep for leftovers,
  check each claim in the report, see CI's verdict. Chain a commit after the check with
  `&&`, never `;`.
- **"Can't" is a research task first**: the docs, the code that does the same thing, the
  web. Say what was checked, and "not verified" with the probe that would settle it,
  never "impossible" on a guess.

<!-- harness:end -->
