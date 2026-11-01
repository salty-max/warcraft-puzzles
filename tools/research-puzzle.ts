import { withLegacyEntries } from "./legacy-bank.ts";
import { createHash } from "node:crypto";
import { z } from "zod";
import { EditorialSchema, SnapshotSchema } from "../packages/content/src/schema.ts";
import { validateCatalogue } from "../packages/content/src/validate.ts";
import {
  LayoutSchema,
  checkingFloorIssues,
  compilePartiallyCheckedLayout,
  inspectPartiallyCheckedFill,
} from "../packages/crossword/src/index.ts";
import { PlacementSchema } from "../packages/crossword/src/answers.ts";
import type { PlayPuzzle } from "../web/model.ts";

export const ResearchPuzzleSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  title: z.string().min(1).max(80),
  status: z.literal("research"),
  format: z.literal("partially-checked"),
  coldSolve: z.null(),
  layout: LayoutSchema,
  placements: z.array(PlacementSchema).min(1),
});

/** Validate a complete authored trial. This neither generates nor approves puzzles. */
export function prepareResearchPuzzle(
  raw: unknown,
  catalogue: unknown,
  evidence: unknown,
) {
  const puzzle = ResearchPuzzleSchema.parse(raw);
  // An authored puzzle may place an entry the rebuild has since rejected (legacy-bank.ts).
  const editorial = EditorialSchema.parse(withLegacyEntries(catalogue, puzzle.id));
  const snapshot = SnapshotSchema.parse(evidence);
  const contentIssues = validateCatalogue(editorial, snapshot, "research");
  if (contentIssues.length) throw new Error("Invalid research catalogue");
  const grid = compilePartiallyCheckedLayout(puzzle.layout);
  const bank = editorial.entries.filter(
    (entry) => !["draft", "rejected"].includes(entry.status),
  );
  const inspection = inspectPartiallyCheckedFill(
    puzzle.layout,
    bank.map((entry) => ({ id: entry.id, grid: entry.answer.grid })),
    puzzle.placements,
  );
  if (inspection.issues.length)
    throw new Error(inspection.issues.map((i) => i.message).join("; "));
  const measurements = grid.slots.map((slot) => ({
    slotId: slot.id,
    checked: slot.crossings.length,
    length: slot.length,
  }));
  if (checkingFloorIssues(grid).length) {
    throw new Error(
      `Trial entries miss the checking floor (2 crossings, 40% up to 7 letters, 3 beyond, no more than 4 unchecked in a row): ${checkingFloorIssues(grid)[0]!.message}`,
    );
  }
  const entries = grid.slots.map((slot) => {
    const placement = puzzle.placements.find((p) => p.slotId === slot.id)!;
    const entry = bank.find((e) => e.id === placement.entryId)!;
    return {
      id: slot.id,
      number: slot.number,
      direction: slot.direction,
      cells: slot.cells,
      answer: entry.answer.grid,
      enumeration: entry.answer.enumeration,
      clue: entry.clue.text,
      hint: entry.hint.text,
    };
  });
  // A direct spelling leak is reviewable automatically. Semantic leaks still need a person.
  for (const a of entries)
    for (const b of entries) {
      if (a.id === b.id) continue;
      const discloses = [a.clue, a.hint].some((text) => {
        const tokens = text.toUpperCase().match(/[A-Z]+/g) ?? [];
        return tokens.some((_, start) => {
          let phrase = "";
          for (const token of tokens.slice(start)) {
            phrase += token;
            if (phrase === b.answer) return true;
            if (phrase.length >= b.answer.length) break;
          }
          return false;
        });
      });
      if (discloses) throw new Error(`Prompt at ${a.id} discloses ${b.id}`);
    }
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ puzzle, entries }))
    .digest("hex");
  const playable: PlayPuzzle = {
    id: puzzle.id,
    title: puzzle.title,
    fingerprint,
    width: grid.width,
    height: grid.height,
    rows: puzzle.layout.rows,
    entries,
  };
  return { puzzle, playable, grid, measurements, solution: inspection.rows };
}
