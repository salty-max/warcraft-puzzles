# Editorial contract

## What qualifies

The first collection covers lore disclosed by the end of Wrath of the Lich King. Later
revelations about earlier events are excluded. The initial source set is Vanilla-era
material. Its eligibility does not imply complete TBC/Wrath coverage.

Admit familiar vocabulary and recognisable people, places and organisations. Ordinary
English words need a meaningful Warcraft connection. Reject random quest titles,
ordinary loot names and forgettable NPC/rare names. A harder label does not make those
entries fair. Iconic artifacts can qualify individually.

Source facts can include a quest or weapon without requiring its exact name as the
answer. The editorial judgment is whether someone has a reasonable route to the answer
from broad Warcraft knowledge and the available crossings.

Use British prose and official game names. Grid forms use A–Z, with spaces, apostrophes
and hyphens removed. Apostrophes do not split the enumeration into words. Unsupported
characters are rejected for review rather than silently discarded. Minimum answer length
is three. Long answers remain in the bank even when the first layouts cannot accommodate
them.

Multi-word names and phrases are first-class answers. Preserve the familiar full form,
show an enumeration such as `(3,4,4)` and use one continuous grid entry. Never shorten a
name just to fit a mini. Slot eligibility uses the total letters, not the length of the
longest word. Include 11×11 and 13×13 among the trial layouts before selecting the daily
format.

## Every entry is an answer–clue–hint triad

- **Answer:** display spelling, grid letters, enumeration and inclusion rationale.
- **Fact:** the supported Warcraft assertion behind the entry.
- **Clue:** the main original question or prompt. Exact source prose is not a substitute
  for writing a good clue.
- **Hint:** a useful extra nudge, such as an associated title, place or event. It must
  not merely repeat the clue or contain the full answer. A hint may be generous, and
  using one will be counted as assistance by the player.
- **Evidence:** exact database locators and short source passages supporting all factual
  statements in both the clue and the hint.

A hint may also give an ordinary-English definition, a word-shape cue or one word of a
multi-word name. Those cues come from the verified answer spelling and normal English
meaning. They do not license an extra unsourced Warcraft claim. A hint should give the
player another route forward rather than simply introducing a less familiar NPC or
restating the question.

Prefer a useful contextual association when it gives the player a second route to the
answer. Avoid making every hint a dictionary definition of its answer, but keep clear
definitions for short footholds where they are helpful. A contextual hint is not
automatically better: another obscure fact or an unrelated name can make it less useful.
Review the clue and hint together, then test them with crossings.

One answer can have several different triads. IDs identify entries, not just letter
strings. Duplicate entry IDs are invalid. Repeated grid strings in a bank are allowed,
but a completed puzzle must not repeat the same normalized answer.

The excerpt checker proves that a passage exists at the recorded locator. It cannot
prove the author's inference, recognise a retcon or decide whether a hint is helpful.
Those are review duties.

## Difficulty

Difficulty is assigned to the clue. Familiarity is assigned to the answer.

- Easy: familiar subject, direct wording and a recoverable answer.
- Medium: a more specific fact or fair indirect wording, helped by crossings.
- Hard: deeper eligible knowledge or more demanding deduction with clear wording.

Game level, item quality and rare rank are not difficulty scores. Check the finished
grid for difficult proper names crossing at an unguessable letter. Cold solvers with
different faction/class experience calibrate the provisional labels. The first seed
intentionally concentrates on easy/medium clues. Its history and dragonflight emphasis
must be balanced with more world, creature, profession and zone vocabulary during
expansion.

## Review states and source changes

1. `draft`: proposed wording or unverified evidence.
2. `evidence-checked`: factual source pass recorded against specific evidence.
3. `reviewed`: editorial wording reviewed, still not approved for release.
4. `approved`: a completed cold pass permits publication at entry level.
5. `rejected`: retained as a record, excluded from publication.

The current 416 triads cover 342 distinct answers and remain `evidence-checked`. The
automated gate requires an explicit cold reviewer and a current content digest for
approved entries. It does not impersonate a human reviewer or auto-approve a successful
source query. Final grid review is an additional milestone after entry review.

Evidence digests bind source-row checksums, excerpts and source versions to the review.
Content digests additionally bind the answer, clue, hint, fact and editorial metadata.
Changing either source facts or approved wording invalidates the relevant review.
Digests detect stale local records, not malicious editing by someone able to rewrite the
entire repository.

To review a change: inspect its source passages, era and wording, record the reviewer's
identity, then update only that entry's review digest. Bulk stamping a new digest is not
a review. A future editor workflow will enforce and audit this transition on the server.

## Lore research

Since 2 November 2026 (the owner's direction) a triad is made in two halves. The
**answer** is a name wow-data confirms by id (classic.db or forever.db: it exists, its
spelling, its kind). The **clue and hint** are original prose written from a research
dossier about the lore: who or what it is, what it did, its history, its relations, what
it means in the world. Spawns, drops, vendors, coordinates and loot tables are not clue
material.

**Dossiers** live in `content/research/<batch>.json` (schema:
`packages/content/src/research.ts`), one per answer: the wow-data entity, three to six
facts, what was dropped and why. A fact is `lore` (a web source), `game` (an in-game
text, a wow-data row), `spelling` (a cue from the answer's own letters, hints only) or
`inference` (from named facts, read by the fact-checker). Every lore or game fact has a
source passage (exact, under 25 words) and `established`: the earliest canon source that
discloses it, with its date.

**Sources.** warcraft.wiki.gg is the main one, read through
`node tools/research-fetch.ts "<Title>"`, which prints each sentence with the reference
that covers it and pins the revision. A reference covers the sentence before it, never
the ones after, and a sentence without one is not enough alone. An in-game book or text
is cited as a `game` source (`readable_page`, `quest_text`), which the verifier checks,
whenever wow-data holds it. Only when it doesn't may its wiki transcription stand as the
game's words, cited as "the in-game book itself" with its patch, and the fact-checker
confirms from the page's patch history that the wording predates 4.0.1 (Cataclysm
rewrote many books). `Ref WoWCV1-3` in a printed reference is the Chronicle. Blizzard's
own pages and pre-2011 Wayback copies of WoWWiki are allowed as `manual` sources, read
by the fact-checker. Not allowed: Wowpedia (it blocks scripted reads, warcraft.wiki.gg
is its fork), Wowhead comments, forums, fan fiction, the Warcraft RPG books (non-canon),
Hearthstone. A summary from WebFetch is never a passage: it paraphrases.

**Era by disclosure.** A fact counts only if a canon source released before 12 October
2010 states it: patch 4.0.1, Cataclysm's first pre-patch, not the box on 7 December. The
pre-patches (4.0.1, 4.0.3a's Shattering), the Chronicle (2016-2018), _The Shattering_
novel (August 2010, a Cataclysm tie-in) and every later quest, novel or comic don't
count, even about old events. `content:check` refuses those by name too. A row in
classic.db doesn't prove vanilla: it holds 2024-25 rows too. Dates the researcher uses
most (give the full day for anything in October 2010 or a 2010 year alone):

| Source                                              | Released                           |
| --------------------------------------------------- | ---------------------------------- |
| Warcraft: Orcs and Humans manual                    | 1994                               |
| Warcraft II manual, Beyond the Dark Portal manual   | 1995, 1996                         |
| Warcraft III and The Frozen Throne manuals          | 2002, 2003                         |
| Lord of the Clans, Of Blood and Honor               | 2000                               |
| Day of the Dragon, The Last Guardian                | 2001, 2002                         |
| War of the Ancients trilogy                         | 2004-2005                          |
| Cycle of Hatred, Rise of the Horde                  | 2006                               |
| Warcraft: Legends (manga)                           | 2006-2009                          |
| Tides of Darkness                                   | 2007                               |
| Beyond the Dark Portal (novel), Night of the Dragon | 2008                               |
| Arthas: Rise of the Lich King                       | 2009                               |
| Stormrage                                           | 2010-03                            |
| The Shattering                                      | 2010, a Cataclysm tie-in: excluded |
| World of Warcraft: Chronicle                        | 2016-2018: excluded                |

In-game texts are dated by the patch that added them (the wiki's "Patch changes").

**Copyright.** Passages are evidence, short, only in the dossier. Clues and hints are
our own words: `content:check` refuses any run shared with a passage or a `says` line
that holds four of the writer's own words (names don't count). Each batch carries a CC
BY-SA attribution line, each passage its URL.

**Checks.**
`node tools/verify-research.ts --database <classic.db> --forever <forever.db>` proves
each answer's entity, each wiki passage in its pinned revision and each game passage in
its row, and writes `content/seed/research-evidence.json`. CI replays that snapshot
offline in `pnpm content:check`, with the dates, the fact ids, the letter-count, leak
and echo rules. The fact-checker reads what no tool can: does the passage say what the
fact claims, is the reference canon and dated right, is it retconned later, does the
clue claim only what its facts hold. A clue may name another banked answer (the owner's
choice, 2 November 2026): `content:check --notes` lists them, the twin rule keeps the
pair out of one grid.

**Voice.** A lore-literate player talking to another, dry and a little wry, never cute
or purple. A clue tells a piece of the story: a deed, a relation, a consequence, a
place's history. The clue goes in by one road, the hint by another. Easy is what most
who did the content know, medium a true but less travelled piece of lore, hard deeper
reading with the same clarity.

## Source snapshots

The seed reads `readable_page`, `quest_text` and curated `name` records through
parameterized queries. Snapshots identify full rows by checksum and retain selected
exact passages. Sources are allowlisted. Player-derived records cannot enter this
pipeline.

Normal validation uses the small committed snapshot. `content:verify-sources`
additionally replays every locator against an explicit read-only database and checks its
whole-file fingerprint. A fresh database, even one with only unrelated changes, requires
an intentional snapshot update. Keep that distinction visible.

The `name` locator supports area, faction, race and spell labels, plus the client's
`spell_description` records. It reads the actual `name` field, while book/quest locators
read `text`. An exact label validates identity/spelling; it does not prove a
geographical relationship, class assignment or availability history.

Spell descriptions support the effects they actually describe. Keep raw tooltip
placeholders such as `$s1` and `$d` intact in evidence. Do not invent resolved damage,
duration, range or target-count values from them. A spell's name alone does not prove
its mechanics. The expanded seed pairs names with descriptions, uses familiar legacy
abilities/effects, and makes no unsupported player-class or learnability claims. Current
client presence alone does not establish first disclosure; era and retcon review remain
manual gates. Structured type/location relationships need their own typed locators and
tests when added. Do not fabricate prose from a structured label.

## Pilot difficulty calibration

The first trial was reported as interesting but easy by the owner after a blind solve.
No time or assistance counts were supplied. Keep that feedback separate from formal
entry and grid approvals. The next trial targets Medium with fifteen familiar answers,
no overlap with the first twelve and fifteen alternate source-backed triads. Eleven
clues are provisionally medium, four are easy footholds. Difficulty comes from less
direct wording and associations, with useful hints retained. The new grid and entry
count also differ, so a change in solve time cannot be attributed to clue wording alone.

The seven-candidate pilot retains both solved puzzles and their save fingerprints. Five
new grids add 59 alternate triads without changing the original 357. Hard candidates
combine deeper lore associations with easier footholds. No clue needs to be obscure
merely because its puzzle targets Hard. All new labels need blind-solve calibration. The
pilot report records actual answer reuse rather than treating every slot as a fresh
answer. No formal entry/grid approvals are inferred from positive owner feedback.
