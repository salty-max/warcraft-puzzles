---
name: content-change
description:
  Add, change or cut answer-clue-hint triads in warcraft-puzzles and carry them through
  the gates (source, fact-checker, cold-solver, editor) to one reviewed commit. Use for
  any change to content/seed/editorial.json, the citations, or the words of a puzzle.
---

# A content change

## 1. Source first

For a new or changed fact, find the row first: a quest, a book page, a name, by id
(`bun ~/code/wow-addons/wow-data/bin/card.ts <kind> <id>`). The citation's excerpt is
copied exactly from that row. Lore after Wrath is out, whatever the source.

## 2. Write the triad

The rules in `CLAUDE.md` and `docs/roles/content.md`: a plain word only with a clue that
needs Warcraft, the hint adds something the clue didn't say, British English, ASCII, no
semicolons. Prefer Warcraft's own names.

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
