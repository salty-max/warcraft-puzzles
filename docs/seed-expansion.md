# First short-word expansion

Date: 1 November 2026. This batch adds 242 sourced triads to the original 100, giving
342 distinct answers. The original entries and their reviews are unchanged. Every entry
remains evidence-checked research content, with no cold approvals.

## What was added

The batch follows the baseline's missing lengths and crossing-letter coverage. It
includes animals and creature types, materials, food, ordinary objects, travel, family
relationships, historical states/actions, and familiar legacy abilities. Answers include
AIR, AXE, EEL, INK, OIL, IRON, OGRE, OATS, WAX, SEW and RIP. Clues and hints remain
original writing with exact supporting references.

Recognisable spell/effect vocabulary adds BLINK, CHARGE, FEAR, REND, KICK, RENEW,
STEALTH and others. Full names such as Frost Nova, Drain Life, Shadow Bolt and Sunder
Armor retain their words and enumerations. No ability name is shortened to manufacture a
small answer.

Ordinary English definitions, clear grammatical tense and word-shape cues provide
another route to an answer. They let a player solve without remembering a specific
collection quest. A familiar English word can qualify through a particular Warcraft
fact; merely occurring somewhere in a quest is not enough. Incidental grammar,
misleading word matches and obscure loot/quest/NPC labels remain excluded.

Source reading matters: an insult calling someone a cow does not prove the presence of
an animal, and `$BOne` can look like BONE to a naive word search. The actual BONE triad
uses the Embalmer's description of his creation. These are reasons to review candidates
in context rather than approve a bulk token export.

## Content comparison

| Measure                       | Original baseline at `c32e58e` | Expanded bank |
| ----------------------------- | ------------------------------ | ------------- |
| Entries / distinct answers    | 100 / 100                      | 342 / 342     |
| Ordinary words / proper names | 45 / 55                        | 277 / 65      |
| Three-letter answers          | 12                             | 94            |
| Four-letter answers           | 8                              | 76            |
| Five-letter answers           | 15                             | 69            |
| Multi-word answers            | 31                             | 35            |
| Exact evidence records        | 148                            | 391           |
| Provisional easy / medium     | 75 / 25                        | 277 / 65      |
| Publication-ready entries     | 0                              | 0             |

The five-letter pool now has answers starting with all five ordinary vowels. The
short-answer increase improves basic length supply; it does not prove adequate crossing
coverage. Difficulty remains a hypothesis about the clue. Many additions are
deliberately direct English footholds; real solves must calibrate that choice.

## Evidence and scope

Sources remain the pinned Classic database, Questie and the client through `wow-data`.
The 391 records comprise 179 quest-text passages, 86 readable pages and 126 name-table
records. The latter include exact spell names and raw spell descriptions as well as
area/race/faction labels. The database is read only; normal CI uses the committed
snapshot without a private database.

Spell descriptions support their stated effects. Tooltip variables stay literal in the
evidence, and no calculated numbers are invented. A name alone does not establish
mechanics, a player class, learnability or disclosure era. The spell/effect selection
uses familiar legacy identities and still requires era review before publication. NPC
effects are not presented as player abilities. This batch does not claim an audit of
TBC/Wrath sources or full coverage of the chosen through-Wrath scope.

Faction exposure is an editorial source-context cue. Quest race masks guide the initial
tags, with book/ability facts generally shared. This is not a complete quest
availability calculation: giver and chain restrictions need further review. Current tags
are 101 Alliance, 39 Horde and 202 shared. Future batches should broaden Horde context
as well as letter patterns. Class/faction backgrounds still matter during cold solving
even when the answer itself is ordinary English.

New evidence digests were bound only for the new entries after reading their source
contexts and refreshing exact citations. Old entries were not bulk reapproved. Content
digests and cold-reviewer fields remain empty. Publication still fails closed.

## Layout experiment and results

The [historical 100-answer report](benchmarks/seed-100.md) preserves the first baseline.
All eighteen original layouts remain unchanged in the current suite. Eleven more blocked
layouts bring it to twenty-nine, including staircase/pinched 5×5 patterns, a clipped 7×7
diamond and two mixed-length patterns at each of 7, 9, 11 and 13.

The mixed layouts were selected for structural properties before trying fills: seeded
symmetric masks, short-run closure, connected white cells, at least 60% white coverage,
and a preference for varied short slots with no run longer than nine. Their selection
did not use the answer bank. The exact layouts are committed data, validated in every
replay. They are diagnostic fixtures, not a representative sample of every possible
crossword layout.

The [current benchmark](fill-benchmark.md) runs three seeds for the full bank and the
proper-name control: **174 cases, zero fills, no budget-limited outcomes**. For the full
bank, eight layouts fail length preflight and twenty-one enter the crossing/uniqueness
search and are exhausted. For the original eighteen layouts, length-preflight failures
fall from twelve to eight, but all still fail to fill. The proper-name control has
length shortages in all twenty-nine layouts.

These are genuine negative results for the exact inputs. The added vocabulary resolved
some length shortages but has not demonstrated a viable daily format. No seven-puzzle
set, annual capacity or production cadence can be claimed yet.

## Decision after the expansion

After these negative results, the user authorised construction of a word-led puzzle with
some unchecked letters before further bulk collection. The former 500–1,000-answer
expansion target is paused. See [the first construction trial](prototype-report.md). The
fully checked benchmark is preserved as a separate comparison. No TBC/Wrath coverage,
cold approval or sustainable daily cadence is claimed by either experiment.
