# Seed selection: how an answer is chosen

Written 1 November 2026 for the bank rebuild. The play-test found the bank was mostly
ordinary English words (PAW, MEN, ROD, RUG, SOW) with quest trivia hung on them: 333 of
416 entries were `ordinary`, 204 were three or four letters, 83 were names. The fill
engine was not at fault, it takes what fits. So the answers are chosen first, by this
note, and the clues are written second.

## The test for an answer

All four must hold.

1. **Warcraft-native.** A name, term or coinage a player knows from the game (Gadgetzan,
   Ashbringer, Trogg, Pyroblast). A plain English word stays only when its clue cannot
   be solved without Warcraft. Plain words are at most about 10% of the bank.
2. **Famous enough.** A player of Classic through Wrath would recognise it, or reach it
   from broad knowledge plus crossings. Rank by fame, not by what the database holds. No
   minor NPCs, routine loot, quest titles or later retcons.
3. **Grid-friendly.** Four to nine letters is the sweet spot. Ten to thirteen for
   multi-word names. Three letters only for iconic words. Mix the vowels and do not pile
   up Q, X, Z or apostrophe-heavy names.
4. **Evidenced.** Every claim in the fact, clue and hint follows from an exact excerpt
   of a wow-data row, cited by locator. A name wow-data does not hold is not an answer
   until a source is settled (see the Wrath rule below).

## Target mix

Per 1,000 answers. A plan to adjust with the evidence, not a quota to force.

| Pool                                                           |     Share |
| -------------------------------------------------------------- | --------: |
| Places: zones, cities, towns, dungeons, raids, battlegrounds   |       20% |
| People: heroes, villains, rulers, lore figures                 |       16% |
| **Peoples, tribes and creatures**: Trogg, Furbolg, Quilboar... |       15% |
| **Classes, talent trees, professions and spells**              |       14% |
| Factions, orders, reputations                                  |        7% |
| Bosses and raid figures                                        |        8% |
| Artifacts, weapons, iconic items                               |        6% |
| Cosmology and events (Sundering, Well of Eternity)             |        4% |
| Plain English words with a Warcraft-only clue                  | up to 10% |

Alliance, Horde and shared exposure stay balanced, the Horde side was thin (118/46/252).

Tribes and creatures are clued by what a player does with them: where you meet them,
what they carry, the quest that sends you after them. Spells are clued by class and
effect from the spell description in this database build, never by the spell's own name.
A spell that is a plain verb (Charge, Smite) stays inside the plain-word cap.

## The pool recipe

1. **Shortlist** from wow-data's Classic database: area names, faction names and
   descriptions, boss and rare-elite creature names, epic items, spell names, creature
   families and types, and a count of how often each name appears in quest text, NPC
   speech and book pages. That count is a substring count and noisy ("Thor", "Mak" are
   artefacts), a shortlist generator only. Drop names whose grid form is a dictionary
   word, and names already banked.
2. **Judge by hand** against the test. Fame beats frequency.
3. **Find the sentence.** For each survivor search the quest text, book pages, faction,
   item and spell descriptions for a sentence that names it and says what the clue
   needs. If no row supports the clue, the answer waits. Never stretch an excerpt.
4. **Write the triad**, then run it through the gates in `content-change`: the
   fact-checker, the cold-solver, the editor once for the batch.

## The cut

Old `ordinary` entries are kept only when they are Warcraft vocabulary in their own
right: races and creature kinds, class names, the signature spells and the Horde's
title. The rest are marked `rejected` (kept as a record, excluded from the fill and
publication) with a note. The seven authored research puzzles that placed them stay
playable through `tools/legacy-bank.ts` (a fixed list of their ids, nothing new can use
it), so the prototype playset still shows the old words until the engine rebuilds it
from this bank.

## Wrath and later names

wow-data holds Vanilla only (Classic Era). Names only Wrath introduced (Ulduar, Icecrown
Citadel, Nerubian, Vrykul, Borean Tundra) have no row to cite. The owner's decision of 1
November 2026 is a documented exception: a short, named list of Wrath names may be
sourced from warcraft.wiki.gg or wowpedia, each with its page, the exception recorded in
its entry notes and kept apart from the database-backed evidence. This first tranche
adds none, every new triad is backed by a database row. Lore figures that the Vanilla
books and speech already narrate (Arthas, Sylvanas, Kel'Thuzad, Frostmourne) need no
exception.

## Results of the first tranche

Run on 1 November 2026. The cut and the first tranche are one change.

| Measure                          |     Before |     After |
| -------------------------------- | ---------: | --------: |
| Live triads (not `rejected`)     |        416 |       396 |
| Distinct answers                 |        342 |       370 |
| Dictionary words (`ordinary`)    |   333, 80% |   84, 21% |
| Names (`proper`)                 |         83 |       312 |
| Answers of three or four letters |        204 |         9 |
| Answers of ten or more letters   |          ? |       135 |
| Alliance / Horde / shared        | 118/46/252 | 67/39/290 |

279 old padding triads are `rejected` (kept as a record). 259 new triads pass the gates:
sourced from a wow-data row each, fact-checked in three batches, cold-solved three
times, one editor pass. 54 old `ordinary` words stay, all Warcraft vocabulary in its own
right (races and creature kinds, the nine class names, signature spells, Warchief). The
dictionary share is 21%, not the 10% target: the kept class abilities (Blink, Charge,
Smite, Stealth, Execute and so on) are plain words whose clues carry the game. The next
tranche trims them first.

### Blind solve (clues only, no crossings)

Round one (309 clues before repair) solved 56%. After the fact-checker's findings and an
editor pass, every clue was rewritten or cut where it failed, and a last run on all 258
live new clues solved **67%** exactly:

| Category             | Clues | Solved |
| -------------------- | ----: | -----: |
| Cosmology and events |     8 |    87% |
| Items                |     6 |    83% |
| Spells and abilities |    66 |    72% |
| Places               |    55 |    70% |
| People               |    39 |    66% |
| Tribes and creatures |    49 |    65% |
| Factions             |    15 |    53% |
| Bosses               |    18 |    50% |

Tribes and spells are reported apart from places and people as asked. The repairs to the
worst round-one failures lifted them from 35% (tribes) and 52% (places) to the figures
above. Bosses and factions are the weak pools: many bosses have only errand quest text
in Vanilla data, so a clue from broad game knowledge has no row behind it. The solvers
were general-purpose agents with no tools (the `cold-solver` helper has an unresolvable
tool list in this build), so read the rate as a floor for a real player.

### What is still open

- The seven committed layouts were drawn for short common words. The rebuilt bank solves
  none of them (`docs/fill-benchmark.md`), the old bank solved all seven. New layouts
  for long names are an engine task, and so is rebuilding the playset.
- Spells need a class and an effect from this database build. The nine talent trees are
  absent as names in Vanilla data and were skipped.
- Wrath-only names (Ulduar, Icecrown Citadel, Nerubian, Vrykul) stay out until the
  documented exception above is exercised.
- Source pages are shared: a few lore books feed up to nine answers each. The "no source
  page twice in a week" rule will need a weekly builder that counts them.
- The cooldown and Horde balance (67 Alliance to 39 Horde) want more Horde towns.
