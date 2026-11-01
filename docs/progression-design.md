# Progression and retention design

Date: 1 November 2026. Status: direction accepted and integrated into the
[production plan](production-plan.md) on this date. Features are not implemented.
Lorebook, milestones and daily/weekly progress come first; saved cosmetic collections
and an earned currency follow later, with surprise caches as a subsequent experiment.
Prices, exact thresholds and optional variants below remain prototype hypotheses.

## Accepted direction

Make the player feel like an explorer assembling a personal archive of Azeroth. Solving
earns discoveries. Finishing a puzzle advances a habit and, in a later release, earns a
small currency. Collectible rewards personalise the archive.

The first version should concentrate on a satisfying crossword, a small lore collection,
visible milestones and a forgiving daily/weekly rhythm. A cosmetic shop and earned
surprise packs can follow once we know people enjoy returning.

| Mechanic                               | Purpose                                                  | Recommendation                                            |
| -------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Lore discoveries                       | Give solved words meaning and build a lasting collection | Main progression system                                   |
| Current/best streak and calendar       | Recognise a daily habit                                  | Include alongside weekly progress                         |
| Weekly expedition                      | Give busy players a reachable goal                       | Four new-to-you puzzles in a week, archive included       |
| Milestone titles and stamps            | Make permanent progress visible                          | Small initial set, based on completion/discoveries        |
| One earned currency                    | Let players choose a collection goal                     | Add with durable account saving and a small cosmetic shop |
| Surprise caches                        | Give completion a little anticipation and ceremony       | Optional later experiment, earned currency and cosmetics  |
| Exploration map or illustrated shelves | Display the growing collection                           | Start with chapter lists, add richer display when useful  |
| Friend/guild comparison                | Encourage sharing and discussion                         | Spoiler-free results first, account features later        |

## 1. A personal lorebook

Map a triad's particular fact to an authored lore entry. The answer string alone is not
enough: FATHER could refer to different families in different puzzles. Use explicit,
reviewed bindings between triad revisions and stable lore-entry IDs.

| Solved context                           | Example discovery              | Existing seed evidence                     |
| ---------------------------------------- | ------------------------------ | ------------------------------------------ |
| FATHER, Durotan's relationship to Thrall | Thrall's Frostwolf heritage    | `book-175752-5`                            |
| BAT, transport to the Undercity          | Arriving in the Undercity      | `quest-6323-details`                       |
| Arathi Basin's resource battle           | What the battle is fought over | `quest-8105-details`, `quest-8120-details` |

These are proposed mappings, not already approved lore pages. Each page needs its own
original prose and factual/era review. Keep entries short enough to read after a puzzle,
roughly 40–100 words when the evidence supports that much. Do not pad a thin fact to
meet a word count. All facts retain the through-Wrath boundary.

Organise the book into a few readable chapters: places, peoples, figures, factions and
histories. A common English answer can unlock an interesting story. Repeated encounters
with an already discovered page do not create duplicate pages. A different fact behind
the same English word may lead somewhere new.

### When a page opens

Recommended default: collect discoveries at puzzle completion, then show a compact
results panel with new-page counts and a few optional reading links. Keep the
crossword's input flow intact. Unlocking a page immediately when a word becomes correct
would confirm the answer for free, changing the meaning of an unassisted solve. A future
guided mode could offer that feedback explicitly.

In the completion panel, highlight at most two or three new pages even when more are
earned. The rest appear in the book. Reading is optional and can be done later. An empty
completion panel should still recognise the solved puzzle and progress toward the next
milestone.

For a private seven-puzzle trial, begin with six to twelve reviewed pages. For a public
thirty-puzzle buffer, budget a featured discovery for each puzzle and review the
resulting page coverage with the schedule. This is additional editorial work, not a free
by-product of generating a grid.

### Completion and assistance

Normal hints, checking and individual reveals can contribute to an assisted completion.
Award the same base progression as for an unassisted completion. Record assistance
honestly in statistics and sharing. Speed does not multiply rewards.

Revealing the whole solution opens review mode. It does not count as an earned
completion, advance the streak or grant currency/discovery stamps. Treat revealing every
answer individually the same way. The explanation can still be read in review mode, so
the player can learn without a false solve record.

This is personal progression. A server can enforce claim limits, but the app cannot
prove someone mentally deduced a public crossword answer. The existing
offline/inspectable solution design remains incompatible with strong claims of
competitive integrity.

### More reasons to explore

Permanent chapter goals can award a title, stamp or book-cover variation. Goals should
use discoveries that are actually obtainable from released puzzles, with a route into
the archive. Avoid a collection that waits for one word which may never appear in the
schedule.

Early examples: finish a first puzzle, discover pages in both continents, complete a
first weekly expedition, or fill a small chapter. These are proposed player
achievements, not claims about canonical Warcraft ranks.

## 2. A habit that tolerates real life

Keep current streak, best streak and a calendar of real completion days. Proposed
definition: at least one first eligible completion on a UTC day. It may be today's
puzzle or a previously unsolved archive puzzle. Replaying a completed grid does not
extend the streak. Use the same UTC boundary as daily publication and show the next
reset in the player's local time.

Alongside the streak, offer a weekly expedition: complete four distinct, new-to-you
puzzles in a Monday-to-Sunday UTC week. They can be completed in one sitting or spread
out. This gives someone who plays at weekends a reachable goal. Collection pages, total
solves and earned titles survive a broken streak.

A later, optional rested-day feature could protect one missed day. Earn it through
participation, cap stored protection, distinguish protected days from played days and
explain its use. Keep large escalating currency multipliers out of long streaks:
returning players should not face a permanently weaker economy. Site outages need an
explicit protection/repair policy with audit events rather than deleting earned
progress.

[Duolingo's engineering explanation](https://blog.duolingo.com/protecting-streaks-from-site-issues/)
describes freezes and repairs for outages. It is useful precedent for handling failure
fairly; it does not establish a retention effect for our crossword.

## 3. Currency and a small collection

Working name: **Ink**. One spendable currency keeps the system understandable. This
proposal models earned currency and cosmetic rewards. A paid economy would be a separate
product decision.

Prototype values:

| Event or purchase                        | Ink  | Rule                                                   |
| ---------------------------------------- | ---- | ------------------------------------------------------ |
| First eligible completion of a puzzle    | +25  | Once for its canonical puzzle identity                 |
| First eligible completion of the UTC day | +75  | Once per day, today's or archive puzzle                |
| Finish the weekly expedition             | +100 | Once per UTC week, after four distinct new completions |
| Surprise cache                           | −300 | One unowned cosmetic from a chosen collection          |
| Choose a particular cosmetic             | −600 | Agency without waiting for a random draw               |

A player doing one new puzzle each day earns 100 Ink daily before weekly bonuses. A
300-Ink cache is then reachable after three active days. Archive play provides another
route, with no repeat-solve farming. These are balancing examples, not settled prices or
a predicted retention result.

Initial items could be book covers, bookmark designs, chapter stamps, portrait frames
and illustrated variants of already earned pages. Keep themes readable and controls
accessible regardless of collection progress. Lore facts come from solving; cosmetic
versions may add a collectible layer to the same entry.

Start with a compact set of twelve coherent items. A first-solve stamp gives immediate
visible progress before a shop exists. Keep items obtainable over time rather than
expiring them at the end of an arbitrary season.

### What about perks?

Cosmetic perks fit the first collection cleanly: chosen title, frame, cover, share-card
style and a shelf displaying favourite discoveries. Keep useful basic hints available to
everyone. Charging struggling players currency for help would conflict with the
accessible solving experience we are designing.

Later, a themed archive expedition or optional extra challenge could be a permanent
unlock. It requires content and scheduling work, so it belongs after the main puzzle
pipeline is sustainable. Avoid stacking extra attempts, consumable powers or difficulty
modifiers onto the first release.

## 4. Borrow the pleasant part of gacha

The appealing part is choosing a themed cache and discovering something new. Prototype
that before building rarity tiers, duplicates and multiple crafting currencies.

Recommended first experiment:

1. Choose an available cosmetic collection, such as a themed set of chapter stamps or
   illustrated page borders.
2. See the remaining items and actual chances before spending.
3. Spend 300 Ink and receive one uniformly selected, unowned item.
4. Show a short, skippable reveal. Respect reduced-motion preferences.
5. Add the item permanently to the collection and allow immediate selection.

Duplicate protection makes the result useful. With twelve unowned items, each has a
one-in-twelve chance. With three left, each has a one-in-three chance. Completing the
set takes at most twelve openings bought with Ink if no items were obtained through
other routes. Once a collection is complete, disable its purchase instead of spending
currency for nothing. Retain the direct-selection option for someone who wants a
particular item.

This has less rarity chasing than conventional gacha. That is a deliberate tradeoff: it
preserves the surprise while keeping the initial design small and allowing a collector
to finish. Test whether the reveal is enjoyable enough before adding a more elaborate
loot table.

[DeNA's 2024 introduction to Pokémon TCG Pocket](https://dena.com/intl/news/4742/)
combines recurring pack opening with binders and collection displays. That is
inspiration for the collecting/display loop, not evidence that its monetisation or
retention results would transfer to this project.

## 5. Sharing and the collection of games

A result card can show puzzle number, completion time if enabled, assistance, discovery
count and a chosen cosmetic. Default to counts rather than the names of newly unlocked
pages: those titles could reveal today's answers.

Design the book and cosmetics so later games can contribute to them. A shared daily
habit should allow someone to enjoy a favourite game without clearing every game each
day. Define new reward rules when another game exists rather than assuming identical
time investment or multiplying today's economy.

Friend and guild features are promising later. Start by making a good result easy to
share, then observe whether people actually share it. Profiles and competitive tables
introduce identity, privacy and integrity requirements that are not needed to test the
first crossword.

## 6. Technical requirements before shipping rewards

Keep progression in a separate domain module with pure rules and explicit events. The
player, content editor and database are adapters around it. Extend the existing
monorepo; a reward system does not need its own service.

Initial records: lore entries and their evidence, triad-to-lore bindings, first
completions, discovery grants, achievement grants and activity days. The currency phase
adds a wallet ledger, owned items, catalog versions, purchase intents and stored draw
results. Pin grants to stable canonical IDs. Editing a puzzle revision or changing its
locale must not mint another award for the same puzzle.

Guest play can keep lore and statistics locally with the existing planned export/import
support. Optional account saving becomes a release requirement for the
currency/inventory phase. A growing collection must have a reliable recovery path.
Migrate guest records deliberately; do not trust an imported currency balance as a
server-issued ledger.

The server enforces:

- First-completion, daily, weekly and first-discovery grants with unique business keys.
  Retries return the original result.
- Atomic currency debit, random selection and item grant in one transaction. A second
  purchase cannot draw from an out-of-date owned-item set.
- Nonnegative balances, valid catalog items, released puzzle eligibility and a saved
  receipt for every purchase intent.
- No rewards for future/draft content, full-solution review or replayed solves.
- Explicit corrections and reversals, preserving the audit trail.

Offline completion keeps base progress. Before the wallet phase, specify and test
daily/weekly bonus treatment around midnight and delayed sync. Recommended approach: a
server-issued day receipt when a puzzle is downloaded, a short documented claim grace
period and an honest pending-sync state. A very late claim can still receive its
first-completion base reward. Do not rely on the device clock to mint arbitrary daily
bonuses.

Required tests include duplicate/reordered events, double taps, network retries, two
devices, revision/locale changes, archive replays, full reveals, hint-assisted
completion, timezone/DST boundaries, offline sync, exhausted collections, distribution
over remaining items, insufficient balances, concurrent purchases, guest migration and
restore. Use deterministic random inputs in tests and platform randomness for live
draws. Production headers, sessions, authorization and privacy checks still apply.

## 7. Rollout and evidence

| Stage                | Deliverable                                                                               | Evidence needed before expanding                                            |
| -------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| First playable trial | Good puzzles, six to twelve lore pages, basic streak/calendar and milestone stamp         | Players finish, understand the hints and voluntarily open discoveries       |
| Public core          | Reviewed lore coverage for the content buffer, weekly expedition and permanent collection | Return visits and archive play continue beyond first-session curiosity      |
| Saved collection     | Optional account sync, recoverable inventory, one currency and a small direct shop        | Persistence/reward invariants pass, and players value choosing collectibles |
| Surprise-cache trial | Duplicate-protected earned loot over the same cosmetic catalog                            | It improves the collecting experience without reducing solving enjoyment    |

Measure first-start-to-completion, return for a later daily, seven-day repeat play,
assistance use, voluntary lore reading, collection use and sharing. Keep raw letters and
unnecessary personal data out of analytics. Small early cohorts provide useful feedback,
not precise population forecasts or proof that one reward caused retention. Establish a
core-puzzle baseline before crediting a new mechanic for an improvement.

The main product risk is editorial and art workload. Every lore page, item, achievement
and themed challenge needs production and review. Keep the first catalogue small, and
treat a beautiful completion moment as more valuable than a long list of currencies and
systems nobody yet uses.
