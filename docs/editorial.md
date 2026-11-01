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

The current 100 entries are `evidence-checked`. The automated gate requires an explicit
cold reviewer and a current content digest for approved entries. It does not impersonate
a human reviewer or auto-approve a successful source query. Final grid review is an
additional milestone after entry review.

Evidence digests bind source-row checksums, excerpts and source versions to the review.
Content digests additionally bind the answer, clue, hint, fact and editorial metadata.
Changing either source facts or approved wording invalidates the relevant review.
Digests detect stale local records, not malicious editing by someone able to rewrite the
entire repository.

To review a change: inspect its source passages, era and wording, record the reviewer's
identity, then update only that entry's review digest. Bulk stamping a new digest is not
a review. A future editor workflow will enforce and audit this transition on the server.

## Source snapshots

The seed reads `readable_page`, `quest_text` and curated `name` records through
parameterized queries. Snapshots identify full rows by checksum and retain selected
exact passages. Sources are allowlisted. Player-derived records cannot enter this
pipeline.

Normal validation uses the small committed snapshot. `content:verify-sources`
additionally replays every locator against an explicit read-only database and checks its
whole-file fingerprint. A fresh database, even one with only unrelated changes, requires
an intentional snapshot update. Keep that distinction visible.

The `name` locator supports area, faction and race labels. It reads the actual `name`
field, while prose locators read `text`. An exact name validates spelling; it does not
prove a geographical or historical relationship. Pair it with text evidence for those
claims. Structured type/location relationships will receive their own typed locators and
tests when added. Do not fabricate a prose quotation from a structured label.
