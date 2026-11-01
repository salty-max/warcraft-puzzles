/**
 * The seven authored research puzzles were built from the bank before the 1 November
 * 2026 rebuild (docs/seed-selection.md). The rebuild marks their padding answers
 * `rejected`, so the bank no longer fills them. Their tests replay them against the old
 * bank by restoring those entries here. The puzzles are history, not the playset.
 */
export const LEGACY_PUZZLES = new Set([
  "first-steps",
  "medium-steps",
  "easy-2",
  "medium-2",
  "medium-3",
  "hard-1",
  "hard-2",
]);

/**
 * Restores the rebuild's cuts for one of the seven legacy puzzles (by id), or for every
 * legacy replay when no id is given. Any other puzzle id gets the catalogue as it is, so
 * a new puzzle cannot place a rejected entry.
 */
export function withLegacyEntries(catalogue: unknown, puzzleId?: string): unknown {
  if (puzzleId !== undefined && !LEGACY_PUZZLES.has(puzzleId)) return catalogue;
  const copy = structuredClone(catalogue) as {
    entries: { status: string; review: { notes: string } }[];
  };
  for (const entry of copy.entries) {
    if (
      entry.status === "rejected" &&
      entry.review.notes.startsWith("Cut 2026-11-01")
    ) {
      entry.status = "evidence-checked";
    }
  }
  return copy;
}
