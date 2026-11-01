import type { Grid } from "./layout.ts";

/** Longest answer held to the percentage rule, longer ones need a flat count. */
export const RATIO_LIMIT = 7;
export const MAX_UNCHECKED_RUN = 4;

/** Crossings an answer of this length needs: 2 and 40% up to seven letters, 3 beyond. */
export function crossingsNeeded(length: number): number {
  return length <= RATIO_LIMIT ? Math.max(2, Math.ceil(0.4 * length)) : 3;
}

export type FloorIssue = { slotId: string; message: string };

/**
 * The partially checked construction floor (docs/grid-engine.md): enough crossings per
 * answer, and no long stretch of letters nothing else checks. A construction-review
 * rule, not a publication approval.
 */
export function checkingFloorIssues(grid: Grid): FloorIssue[] {
  const issues: FloorIssue[] = [];
  for (const slot of grid.slots) {
    const checked = new Set(slot.crossings.map((crossing) => crossing.offset));
    if (checked.size < crossingsNeeded(slot.length))
      issues.push({
        slotId: slot.id,
        message: `${slot.id} has ${checked.size} crossings, needs ${crossingsNeeded(slot.length)}`,
      });
    let run = 0;
    for (let offset = 0; offset < slot.length; offset++) {
      run = checked.has(offset) ? 0 : run + 1;
      if (run > MAX_UNCHECKED_RUN) {
        issues.push({
          slotId: slot.id,
          message: `${slot.id} has more than ${MAX_UNCHECKED_RUN} unchecked letters in a row`,
        });
        break;
      }
    }
  }
  return issues;
}
