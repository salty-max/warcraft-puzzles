import { z } from "zod";
import { parseCandidates, PlacementSchema } from "./answers.ts";
import { compileLayout } from "./layout.ts";
import type { GridIssue } from "./layout.ts";

/** Independent of the search: reject partial, contradictory and repeated fills. */
export function inspectFill(layout: unknown, bank: unknown, input: unknown) {
  const grid = compileLayout(layout);
  const candidates = new Map(
    parseCandidates(bank).map((entry) => [entry.id, entry.grid]),
  );
  const placements = z.array(PlacementSchema).parse(input);
  const slots = new Map(grid.slots.map((slot) => [slot.id, slot]));
  const issues: GridIssue[] = [];
  const seenSlots = new Set<string>();
  const usedWords = new Set<string>();
  const cells = [...grid.layout.rows.join("")];
  for (const placement of placements) {
    const slot = slots.get(placement.slotId);
    const word = candidates.get(placement.entryId);
    if (!slot || !word) {
      issues.push({
        code: "unknown-reference",
        message: `Unknown slot or entry: ${placement.slotId}/${placement.entryId}`,
      });
      continue;
    }
    if (seenSlots.has(slot.id))
      issues.push({ code: "duplicate-slot", message: `Repeated slot ${slot.id}` });
    seenSlots.add(slot.id);
    if (usedWords.has(word))
      issues.push({ code: "repeated-answer", message: `Repeated grid answer ${word}` });
    usedWords.add(word);
    if (word.length !== slot.length) {
      issues.push({ code: "length", message: `Wrong length at ${slot.id}` });
      continue;
    }
    slot.cells.forEach((cell, offset) => {
      if (cells[cell] !== "." && cells[cell] !== word[offset]) {
        issues.push({
          code: "crossing",
          message: `Conflicting letters at cell ${cell}`,
        });
      }
      cells[cell] = word[offset]!;
    });
  }
  for (const slot of grid.slots) {
    if (!seenSlots.has(slot.id))
      issues.push({ code: "missing-slot", message: `Missing ${slot.id}` });
  }
  const rows = Array.from({ length: grid.height }, (_, row) =>
    cells.slice(row * grid.width, (row + 1) * grid.width).join(""),
  );
  return { issues, rows };
}
