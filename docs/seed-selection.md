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

## Results of the second tranche

Run on 2 November 2026. Aim: 396 toward 800 distinct answers, weighted to five- and
nine-letter names (the engine's finding), a reserve of glue words, and the weak pools.

| Measure                             |    Before |      After |
| ----------------------------------- | --------: | ---------: |
| Live triads (not `rejected`)        |       396 |        614 |
| Distinct answers                    |       370 |        588 |
| Names (`proper`) / dictionary words |  312 / 84 |  505 / 109 |
| Distinct answers of 3-4 / 5 letters |    8 / 33 |    15 / 43 |
| Distinct answers of 9 / 10+ letters |  69 / 130 |  128 / 201 |
| Alliance / Horde / shared           | 67/39/290 | 106/83/433 |

218 new triads stand, 132 short of the 350 asked and 212 short of 800 distinct answers.
The cause is the source, not effort. wow-data holds Vanilla only, and the agents found
that most famous names have no usable row (every Naxxramas and Ahn'Qiraj boss, most
Molten Core and Zul'Gurub bosses, every Outland and Northrend place). 244 drafts were
merged, 18 were cut at the gates and 8 more after the review. Five-letter names are the
hardest: only 10 new ones survived (Baine, Eonar, Jin'do, Omokk, Strom, Zanza, Flare,
Shred, Sting, Totem), so the engine's five-letter bottleneck is eased from 33 to 43, not
solved. The Wrath-name exception (sourcing a short named list from the wiki) is still
unused, and is the one lever that would add five-letter Northrend names.

### How the gates went

Four content agents wrote places, people and bosses, tribes and factions, spells and
items, then glue and breadth (the first glue agent stalled and was replaced). Two
fact-checkers read 205 triads (about 60 problems: unsupported adjectives, a reversed
direction, wrong victims, clues that name another banked answer, letter counts left in
clue text). The cold-solver scored round one at 55%. A repair pass rewrote 157 and cut
one, the round-two glue gate rewrote 26 and cut five (TOME, LAVA, MANA, DOOM, FEL: the
first two rest on Season of Discovery rows, the others are dictionary words with no
honest Warcraft clue). A third fact-check of the rewrites, one editor pass (Opus) and a
last repair pass (98 rewritten, 12 cut) closed it. 18 triads were cut after the gates.

### Blind solve (clues only, no crossings)

The 218 live new clues, each at its last round (a clue untouched after its first solve
keeps that result, a rewritten clue is scored on its final text): **60%** solved
exactly. The rewritten set alone, which holds the hard residue, scored 40% in its last
round, so the figure is lower than tranche 1's 67% and is a floor.

| Category             | Clues | Solved |
| -------------------- | ----: | -----: |
| People               |    30 |    73% |
| Places               |    50 |    70% |
| Items                |    15 |    60% |
| Spells and abilities |    44 |    56% |
| Cosmology and events |    11 |    54% |
| Tribes and creatures |    31 |    55% |
| Factions             |    11 |    45% |
| Bosses               |    19 |    36% |
| Glue words           |     7 |    71% |

| Length             | Clues | Solved |
| ------------------ | ----: | -----: |
| 3-4 letters (glue) |     7 |    71% |
| 5 letters          |    10 |    50% |
| 6-8 letters        |    71 |    66% |
| 9 letters          |    59 |    62% |
| 10 or more         |    71 |    52% |

Easy 91%, medium 67%, hard 32%. The editor's verdict moved 38 clues that a blind solver
misses twice but a player could reach with crossings to `hard`. The weak pools are the
same as in tranche 1: bosses (only errand quest text in Vanilla data) and factions.

### The glue words

The user allows short plain words back only where they sit naturally in the game.
Thirty-two were drafted and seven stand: MOJO, LOA, MAUL, RAKE, WYRM, VOID and WELL. The
rest (ORC-sized words like ELF, ALE, MANA, TOME, FEL, DOOM, LAVA among them) failed the
bar: Vanilla rows give them as bare spell tooltips, item flavour, errand text or Season
of Discovery rows. Seven glue words is far short of the reserve of 100 the layouts would
like, and more will not come from this database. If the layouts need 3-4 letter fill,
the honest options are more of the checked squares, or a deliberate glue list sourced
from the game's interface strings (wow-data's `client_GlobalStrings`), a decision for
the owner.

### What is still open

- Spells carry no class: wow-data names a class for almost none of them. The editor
  noted this causes most spell misses. A class column would come from the client
  SkillLineAbility table, a wow-data task, not a clue rewrite.
- 22 hints only restate their clue and nothing in the database gave a better one.
- Source pages: the aspects book (object 175726) feeds about ten answers. The weekly
  builder has to count by book, not by page.
- Pairs that never share a puzzle (about 30 groups in the editor's notes, among them
  MITHRIL and TRUESILVER, FELCLOTH and MOONCLOTH, STROM and STROMGARDE, VALTHALAK and
  DRAKKISATH, BADLANDS and KARGATH).
- Horde stands at 83 against 106 Alliance, better than 39 against 67.
- The reviewer found plain-word clues that are definitions (LEVITATE, TAUNT, HIBERNATE,
  DISTRACT, DISENGAGE, COUNTERATTACK, RIPOSTE, SEDUCTION): cut, since no row names a
  class to anchor them. HERBALISM, ABOMINATION and PANTHEON stay but are the next to
  trim.
- Near-twin pairs exist only as prose here. Sharp ones: ELDRETHALAS (hint "also called
  Dire Maul") with MAUL, ASTRALRECALL (hint names the Innkeeper) with INNKEEPER,
  DRAKKISATH with DRAGONSPAWN and VALTHALAK, MITHRIL with TRUESILVER, ARCANITE with
  THORIUM. The builder needs them as data before a fill can put both in one grid.
- `vitest.config.ts` gets `testTimeout: 30000`: the two benchmark tests replay the whole
  bank on every layout and timed out at 5 s under coverage once the bank grew.
