---
name: content-change
description:
  Add, change or cut answer-clue-hint triads in warcraft-puzzles and carry them through
  the gates (source, fact-checker, cold-solver, editor) to one reviewed commit. Use for
  any change to content/seed/editorial.json, the citations, or the words of a puzzle.
---

# A content change

## 1. Research first

The answer comes from wow-data by id
(`bun ~/code/wow-addons/wow-data/bin/card.ts <kind> <id>`). The clue and hint come from
lore research: a dossier per answer in `content/research/<batch>.json`, written by the
`researcher` helper (`docs/editorial.md`, "Lore research"). Then prove it:

```bash
node tools/verify-research.ts --database "$WOW_DATA_DB" --forever ~/code/wow-addons/wow-data/.cache/db/forever.db
```

`pnpm content:dossier <batch>` writes the batch's read-out, `docs/research-<batch>.md`
(`pnpm check` fails when it is stale).

Lore disclosed after Wrath (12 October 2010, patch 4.0.1) is out, whatever the source.
Older triads still stand on wow-data excerpts until they are rewritten.

## 2. Write the triad

From the dossier only, never the wiki pages (the writer is Opus at high effort, a
subagent per batch). The voice guide is in `docs/editorial.md`: a deed, a relation, a
history, never a spawn, drop or vendor. The clue takes one route, the hint another. The
rules in `CLAUDE.md` and `docs/roles/content.md`: a plain word only with a clue that
needs Warcraft, British English, ASCII, no semicolons, no letter counts, never four
words in a row from a passage. `pnpm content:check --notes` lists clues that name
another banked answer (allowed, avoid where it's easy).

## 3. Refresh and validate

```bash
export WOW_DATA_DB=~/code/wow-addons/wow-data/.cache/db/classic.db
pnpm content:refresh --database "$WOW_DATA_DB"     # only when citations changed
pnpm content:check && pnpm content:report
```

A changed source row resets that entry's evidence review, a changed wording resets its
approval (GPT's rule, enforced by the digests). Never rewrite a digest without the
review it stands for.

## 4. The gates

1. **fact-checker** on the changed ids (about 140 per call).
2. **cold-solver** on the changed clues. Put the clues in its prompt, numbers instead of
   ids (`number | (enumeration) | clue`). It has no tools, so it can't reach the key.
   Score it yourself. A `plain` answer to a plain word means a re-clue or a cut.
3. **editor** (Opus) once for the batch, with the two results.

Fix what they find in the same uncommitted files.

## 5. Commit

`bun harness/q.ts check -- pnpm check`, the packet, the `reviewer`, the verdict with
`harness/review.ts`, one commit (`feat(content): …` or `fix(content): …`).
