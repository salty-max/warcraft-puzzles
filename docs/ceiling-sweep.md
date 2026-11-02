# Ceiling sweep: how many answers the game's own text can supply

Wave 1, stage 1, 2 November 2026. Read-only: wow-data's `classic.db` and `forever.db` by
id (both are vanilla-era builds, pins in `~/code/wow-addons/wow-data/pins.json`), the
bank in `content/seed/editorial.json`, the layout family's use in `docs/grid-engine.md`.
Nothing here is a triad. The candidate list is `docs/ceiling-sweep-candidates.json`.

**Measurement** means counted from the databases or the bank. **Calibrated** means a
measured sample (36 names) carried over to the pool. **Guess** means my estimate with
nothing behind it but judgement.

## The headline

- The databases hold **no Burning Crusade or Wrath names** (Ulduar, Borean Tundra,
  Pandaria show up only as global strings). Everything below is vanilla, so the quotas
  for the Horde, Northrend and Burning Crusade can only be met from the wiki exception,
  which this sweep cannot count. (measurement)
- Of 13,266 names not in the bank, **601** are Warcraft-native lore names that the game
  text mentions in at least three rows, **235** at six or more. (measurement)
- Of those, **about 17% pass** the three-story-facts test (6 of 36), **28%** at six
  mentions or more, **6%** below. Five in six fail, against the pilot's one in six,
  because the pool left is minor NPCs (vendors, trainers, quest-givers) now the famous
  names are banked. (calibrated, n = 36, so wide error bars)
- That is **about 88 passing lore answers** across 3 to 12 letters, and about **175 new
  answers** if spells and short glue are added at guessed rates. (calibrated + guess)
- **The ceiling from the game's own text is about 935 distinct answers** (761 banked
  plus about 175), or **1,030 to 1,230** with a guessed 100 to 300 from the wiki for
  Burning Crusade and Wrath.

## Method

1. Candidates: every enUS name in `classic.db` of kind area, faction, encounter, race,
   creature family, skill line, map, creature, rare+ item, object, spell, plus the
   `forever.db` names that `classic.db` lacks. Letters only, 3 to 12 long, under 30
   characters.
2. Dropped: anything whose grid form is already in the bank (761 distinct active
   answers), dictionary words (`/usr/share/dict/web2`) except 3 to 4 letter glue, names
   starting "The", "Tamed", digits and cast markers.
3. Fame/lore proxy: the number of distinct text rows (quest text, NPC speech, book
   pages, spell, item, faction and aura descriptions) that contain the name. A proxy
   only. It over-counts a name that is also a common word or a surname (Quinn 13, Modr
   21).
4. Calibration: 36 names (6 per length from 4 to 9, 3 at six or more mentions and 3
   below), each checked by the researcher helper against the wiki and `quest_text` for
   at least three story facts disclosed before 12 October 2010, and judged on fame. Pass
   means three facts and fame of medium or higher. It did not date every fact, so the
   pass rate is, if anything, a little high.

## Candidates and estimated passes

Lore pool = creatures, elites, areas, encounters, factions, rare+ items, minus names
under three mentions. Spell pool = non-dictionary spell names at six mentions or more.
Glue pool = dictionary words of 3 to 4 letters at six mentions or more.

| len | lore ≥3 | of which ≥6 | est. lore passes | spells ≥6 | est. spell passes | glue ≥6 | est. glue passes |
| --- | ------: | ----------: | ---------------: | --------: | ----------------: | ------: | ---------------: |
| 3   |       1 |           1 |                0 |         0 |                 0 |      20 |                5 |
| 4   |      17 |           4 |                2 |         4 |                 1 |      88 |               22 |
| 5   |      51 |          16 |                7 |         5 |                 2 |       - |                - |
| 6   |      73 |          32 |               11 |        10 |                 3 |       - |                - |
| 7   |      67 |          30 |               11 |        20 |                 6 |       - |                - |
| 8   |      73 |          29 |               11 |        31 |                 9 |       - |                - |
| 9   |      61 |          23 |                9 |        32 |                10 |       - |                - |
| 10  |      78 |          30 |               11 |        32 |                10 |       - |                - |
| 11  |      84 |          36 |               13 |        34 |                10 |       - |                - |
| 12  |      96 |          34 |               13 |        28 |                 8 |       - |                - |
| sum |     601 |         235 |              ~88 |       196 |               ~60 |     108 |              ~27 |

- Candidate counts: measurement.
- Lore passes: calibrated, 28% of the six-plus tier plus 6% of the 3 to 5 tier. Lengths
  10 to 12 were not in the sample (mostly multi-word names), so they are the same rates
  carried over. The 4 and 5 letter samples passed 0 of 12, so 2 and 7 are generous.
- Spell passes: **guess**, 30% of the six-plus pool. Spell answers stand on the spell's
  description and class, not story, so the three-story-facts test does not apply
  directly. Cat Form and Charged are weak. Careful: Mind Flay, Soul Fire, Healing Wave,
  Smelting, First Aid and Poisons look like good spells but the bank already rejected
  them (one-sentence description, no second route to the answer), so the pool is padded
  with known failures and 30% is, if anything, generous.
- Rejected answers: the pool drops only active bank answers, so **48 answers the bank
  rejected earlier re-enter it** (38 glue, 6 spells, 4 lore: Grell, Makrura, Highperch,
  Kandrostrasz). They are marked `rejected` in the candidates file. Glue may return
  under the 2 November glue rule, the rest should be read as already-failed. Without
  them the glue pool is 70 and the spell pool 190.
- Glue passes: **guess**, 25% of the pool, taking a plain word only where an in-world
  clue exists (a spell, a phrase, a role). I did not sample these. Cut-and-try on 20
  would settle it.
- The sample says what fails: all of the 4 and 5 letter names (single vendors, trainers,
  quest-givers) and most of the low-mention tier. What passes sits on a named storyline
  (Valthalak and the Veiled Blade: Bodley, Isalien), a famous character (Nat Pagle) or a
  famous place (Raven Hill, Ring of Law). Mentions weakly predict a pass, connection to
  a named storyline predicts better, so stage 2 should filter on that before
  researching.

## Against the per-day supply table

The layout family's use (per day, `docs/grid-engine.md`), the bank's supply over a
90-day cooldown, and what the sweep adds. "Need" is use times 90.

| len   | use/day | need (90 d) | bank | short by | new, est. | still short |
| ----- | ------: | ----------: | ---: | -------: | --------: | ----------: |
| 3-4   |    1.50 |         135 |   81 |       54 |       ~30 |         ~24 |
| 5     |    0.43 |          39 |   49 |        - |        ~9 |           - |
| 6     |    0.50 |          45 |   55 |        - |       ~15 |           - |
| 7     |    1.36 |         122 |   76 |       46 |       ~17 |         ~29 |
| 8     |    1.57 |         141 |  101 |       40 |       ~20 |         ~20 |
| 9     |    2.64 |         238 |  151 |       87 |       ~19 |         ~68 |
| 10    |    0.64 |          58 |   89 |        - |       ~21 |           - |
| 11    |    0.43 |          39 |   53 |        - |       ~23 |           - |
| 12    |    0.14 |          13 |   39 |        - |       ~21 |           - |
| 13    |    0.07 |           6 |   29 |        - |         0 |           - |
| total |     9.3 |         836 |  723 |          |      ~175 |             |

Bank, use and need: measurement. New: the table above (calibrated plus guess). The
bank's 761 includes 38 answers of 14 to 17 letters that fit no layout, so the placeable
bank is 723 and the 13 row is the 13-letter answers only (`docs/grid-engine.md`).

The new supply is **in the wrong place**. The scarce lengths (glue, 7, 8, 9) get about
86 of the 175, under two fifths of the 227 they are short. The rest lands on 5, 6 and 10
to 12, which already have a surplus. The layout family as it stands cannot be fed by the
game's own text. It would have to be re-tuned to a longer mix (more 10 to 12, fewer 9s).
The wiki pool (Northrend and Outland multi-word names) probably leans long too (guess).

## The ceiling in days

At 9.3 answers a day, ten a day for the bigger grids.

**Unique daily, no answer ever reused**, per length: days = (bank + new) / use.

| len     | days now | days with the sweep |
| ------- | -------: | ------------------: |
| 3-4     |       54 |                  74 |
| 7       |       56 |                  68 |
| 8       |       64 |                  77 |
| 9       |       57 |                  64 |
| 10 - 12 |    123 + |               172 + |

The scarcest length binds: **about 54 days now, about 64 days with the sweep** (nines).
**These are upper bounds, not forecasts.** They assume every answer is spent with no
fill slack. The engine measured the same constraint at 25 puzzles (day 26 fails) against
the 54 here, a ratio of about 0.46, because at day 26 the filler had run out of choice
(21 four-letter answers left, not zero) before the bank ran dry. Expect roughly half of
every days figure below until a supply-aware picker exists. If the layouts were re-tuned
to the bank's own length mix, the ceiling is the total instead: (723 + 175) / 9.3 =
**about 97 days** (about 105 to 130 days with a guessed 100 to 300 wiki answers), also
an upper bound.

**With each answer reused after 90 days under a fresh clue**, a mix-matched layout
family needs about 837 distinct answers in a window to run at all, which the game text
meets (936). Each answer then gives as many appearances as it has independent clue
angles, so days are roughly angles times the unique-days figure, provided that figure is
at least 90:

| independent angles | game text alone (~100 d) | with a guessed wiki 100-300 (110-133 d) |
| -----------------: | -----------------------: | --------------------------------------: |
|                  1 |                      100 |                               110 - 133 |
|                  2 |                      200 |                               220 - 266 |
|                  3 |                      300 |                               330 - 399 |
|                  4 |                      400 |                               440 - 532 |

- The six passes in the sample had 3 to 5 angles each (Bodley 4, Isalien 4, Nat Pagle 5,
  Raven Hill 3, Ring of Law 4, Shy-Rotam 3), because passing means three facts. So 3 is
  the honest assumption for a passing lore answer. (calibrated, six answers)
- About 87 of the 175 new answers are spells and glue, never sampled for angles. A spell
  often has one description, so 3 angles for them is a **guess**, probably high.
- The old bank (761) was not tested for angles. Its answers were sourced from excerpts,
  not dossiers, so many have one angle. Counting them at 3 is a **guess**, and the
  3-angle rows overstate the days if they have fewer. Cautious case, banked answers at 1
  or 2 angles and the 175 new at 3: (761 + 525) / 9.3 = 138 days at 1, (1,522 + 525) /
  9.3 = 220 days at 2, before the 0.46 ratio above.
- Reuse only works if the 90-day window holds enough in each length (the table above).
  Today's layouts do not, so the reuse numbers need the re-tuned layouts first.
- A re-clued answer also has to stay a fair, distinct clue. The cooldown rule in
  `CLAUDE.md` asks for a fresh clue, and a fresh angle on a fact a player already saw is
  still the same answer, so an editor pass is part of the cost.

## What is measurement, what is a guess

- Measured: 13,266 unbanked candidates, the 601/235 lore split, the bank per length and
  per source era (712 vanilla, 4 Burning Crusade, 45 `warcraft`, no Wrath), the layout
  family's use per day.
- Calibrated, small sample: 17% pass (6 of 36), 28% and 6% by mention tier, 3 to 5
  angles per passing answer. Per-length rates are not trustworthy at n = 6.
- Guess: the spell pass rate (30%), the glue pass rate (25%), 10 to 12 letter rates, the
  wiki pool of 100 to 300 for Burning Crusade and Wrath, the angle count of the old
  bank, and every "days" figure built on them.
- Not checked: dates of every fact (the sample leaned on vanilla quest text and the
  wiki's own cites, a few cited only to Cataclysm quests were discounted), whether a
  passing name is clean of twins in the bank, and the 90-day window on real picks.

## What this means for stage 2

- The 40 to 60 answers cannot all be 4, 7, 8 and 9 letters from vanilla names: the pool
  holds about 2, 11, 11 and 9 lore passes at those lengths. Expect to fill the scarce
  lengths with spells (7 to 9), in-world glue words (3 to 4) and wiki names (Burning
  Crusade, Northrend) that the database cannot list.
- Filter the stage-2 list on a named storyline or a famous place, not on mentions alone.
- Record the number of independent angles in every dossier, as the card asks. It is the
  figure that turns 936 answers into 300 days or 100.
- The bigger lever may not be more names. The layouts spend 9.3 answers a day, and a
  family that spent 7 (lighter grids, longer words) would stretch every number above by
  a third.

## Appendix: the calibration sample

36 names, 6 per length from 4 to 9. Facts are story facts found before 12 October 2010
by the researcher helper (a count, not a dossier), fame its judgement. Pass is three
facts and fame of medium or higher. Borderline fails are marked.

| name        | len | mentions |  facts | fame        | angles | pass           |
| ----------- | --: | -------: | -----: | ----------- | -----: | -------------- |
| Modr        |   4 |       21 |      1 | low         |      1 | no             |
| Krog        |   4 |        7 |    0-1 | low         |      1 | no             |
| Nogg        |   4 |        9 |      2 | medium      |      2 | no             |
| Zolo        |   4 |        4 |    1-2 | low         |      1 | no             |
| Tumi        |   4 |        3 |      1 | low         |      1 | no             |
| Egan        |   4 |        5 |      3 | low         |      2 | no             |
| Ur'kyo      |   5 |       14 |      2 | medium      |      2 | no             |
| Zengu       |   5 |        8 |      3 | low         |      2 | no             |
| Quinn       |   5 |       13 |      0 | low         |      0 | no             |
| Nipsy       |   5 |        5 |      2 | medium      |      2 | no             |
| Salfa       |   5 |        3 |    1-2 | low         |      1 | no             |
| Zamja       |   5 |        4 |    0-1 | low         |      1 | no             |
| Gornek      |   6 |        7 |      1 | medium      |      1 | no             |
| Bodley      |   6 |       55 |     5+ | medium-high |      4 | **yes**        |
| Ogtinc      |   6 |        9 |    1-2 | low         |      1 | no             |
| Rhinag      |   6 |        3 |      1 | low         |      1 | no             |
| Gazban      |   6 |        3 |    3-4 | low         |      3 | no             |
| Ursius      |   6 |        3 |      1 | low         |      1 | no             |
| Tajarri     |   7 |        6 |      2 | low-medium  |      2 | no             |
| Isalien     |   7 |        9 |      5 | medium      |      4 | **yes**        |
| Oralius     |   7 |       11 |      2 | low         |      1 | no             |
| Grimlok     |   7 |        5 |      3 | low-medium  |      3 | no, borderline |
| Tran'rek    |   7 |        5 |    0-1 | low         |      1 | no             |
| Quentin     |   7 |        3 |      2 | low         |      1 | no             |
| Shy-Rotam   |   8 |        6 |    3-4 | medium      |      3 | yes, marginal  |
| Nat Pagle   |   8 |       15 |     6+ | high        |      5 | **yes**        |
| Lar'korwi   |   8 |       11 | 2 (3?) | medium      |      2 | no, borderline |
| Renataki    |   8 |        4 |      2 | medium      |      2 | no, borderline |
| Mire Lord   |   8 |        3 |      1 | low         |      1 | no             |
| War Rider   |   8 |        3 |      1 | medium      |      1 | no             |
| Raven Hill  |   9 |       14 |    3-4 | medium      |      3 | **yes**        |
| Rockbiter   |   9 |       13 |      1 | low (lore)  |      1 | no             |
| Skulk Rock  |   9 |        7 |      2 | low         |      1 | no             |
| Ring of Law |   9 |        3 |      4 | high        |      4 | **yes**        |
| Northdale   |   9 |        3 |      3 | low-medium  |      2 | no, borderline |
| Karl Boran  |   9 |        3 |    0-1 | low         |      1 | no             |

Dropping the fame test and counting borderline facts, Egan, Zengu, Gazban, Grimlok,
Northdale and Lar'korwi pass too: 12 of 36 (33%), the lenient bound. The failures are
almost all single vendors, trainers and quest-givers. Shy-Rotam's third fact may be
Cataclysm-era, so her pass is marginal, and Raven Hill's backstory is `[no ref]` on the
wiki.
