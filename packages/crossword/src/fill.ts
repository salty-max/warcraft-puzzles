import { z } from "zod";
import { distinctCandidates } from "./answers.ts";
import type { Placement } from "./answers.ts";
import { compileLayout } from "./layout.ts";

export const ALGORITHM_VERSION = "ac-mrv-1";
const OptionsSchema = z.strictObject({
  seed: z.number().int().min(0).max(0xffffffff),
  nodeLimit: z.number().int().min(1).max(1000000),
  timeLimitMs: z.number().positive().finite().optional(),
});
export type FillOptions = z.infer<typeof OptionsSchema>;
export type LengthDeficit = {
  length: number;
  slots: number;
  words: number;
  missing: number;
};
export type DeadEnd = {
  slotId: string;
  pattern: string;
  length: number;
  occurrences: number;
  supports: string[];
};
export type FillResult = {
  status: "solved" | "unsatisfiable" | "budget-exhausted";
  limit: "node" | "time" | null;
  placements: Placement[];
  stats: { nodes: number; backtracks: number; domainPrunes: number; maxDepth: number };
  diagnostics: { lengthDeficits: LengthDeficit[]; deadEnds: DeadEnd[] };
};

/** Stable, local PRNG. Never alters global randomness or depends on input order. */
function randomSource(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Arc consistency + forced-word exclusion, then minimum-domain backtracking. */
export function fillGrid(
  layout: unknown,
  bank: unknown,
  input: FillOptions,
  clock: () => number = () => performance.now(),
): FillResult {
  const options = OptionsSchema.parse(input);
  const grid = compileLayout(layout);
  const words = distinctCandidates(bank);
  const stats = { nodes: 0, backtracks: 0, domainPrunes: 0, maxDepth: 0 };
  const lengthDeficits: LengthDeficit[] = [];
  const demand = new Map<number, number>();
  for (const slot of grid.slots)
    demand.set(slot.length, (demand.get(slot.length) ?? 0) + 1);
  for (const [length, slots] of [...demand].sort((a, b) => a[0] - b[0])) {
    const count = words.filter((word) => word.grid.length === length).length;
    if (count < slots)
      lengthDeficits.push({ length, slots, words: count, missing: slots - count });
  }
  const deadEnds = new Map<string, DeadEnd>();
  let limit: FillResult["limit"] = null;
  const result = (
    status: FillResult["status"],
    placements: Placement[] = [],
  ): FillResult => ({
    status,
    limit,
    placements,
    stats,
    diagnostics: {
      lengthDeficits,
      deadEnds: [...deadEnds.values()]
        .sort(
          (a, b) =>
            b.occurrences - a.occurrences ||
            (a.slotId < b.slotId ? -1 : a.slotId > b.slotId ? 1 : 0) ||
            (a.pattern < b.pattern ? -1 : a.pattern > b.pattern ? 1 : 0),
        )
        .slice(0, 8),
    },
  });
  if (lengthDeficits.length) return result("unsatisfiable");
  const start = options.timeLimitMs === undefined ? 0 : clock();
  const expired = () => {
    if (options.timeLimitMs !== undefined && clock() - start >= options.timeLimitMs) {
      limit = "time";
      return true;
    }
    return false;
  };
  const domains = grid.slots.map((slot) =>
    words.flatMap((word, index) => (word.grid.length === slot.length ? [index] : [])),
  );
  const dead = (index: number, state: number[][]) => {
    const slot = grid.slots[index]!;
    const pattern = Array<string>(slot.length).fill(".");
    const supports = Array<string>(slot.length).fill("");
    for (const crossing of slot.crossings) {
      const other = state[crossing.other]!;
      const letters = [
        ...new Set(
          other.map((candidate) => words[candidate]!.grid[crossing.otherOffset]!),
        ),
      ]
        .sort()
        .join("");
      supports[crossing.offset] = letters;
      if (letters.length === 1) pattern[crossing.offset] = letters;
    }
    const text = pattern.join("");
    const key = `${slot.id}:${text}:${supports.join("/")}`;
    const previous = deadEnds.get(key);
    // Bound diagnostics independently of the search budget.
    if (previous) previous.occurrences++;
    else if (deadEnds.size < 100)
      deadEnds.set(key, {
        slotId: slot.id,
        pattern: text,
        length: slot.length,
        occurrences: 1,
        supports,
      });
  };
  const propagate = (state: number[][]): "consistent" | "dead" | "limit" => {
    let changed = true;
    while (changed) {
      changed = false;
      for (let index = 0; index < state.length; index++) {
        if (expired()) return "limit";
        const slot = grid.slots[index]!;
        const forcedElsewhere = new Set(
          state.flatMap((domain, other) =>
            other !== index && domain.length === 1 ? domain : [],
          ),
        );
        const support = slot.crossings.map((crossing) => ({
          crossing,
          letters: new Set(
            state[crossing.other]!.map(
              (candidate) => words[candidate]!.grid[crossing.otherOffset],
            ),
          ),
        }));
        const before = state[index]!;
        const after = before.filter(
          (candidate) =>
            !forcedElsewhere.has(candidate) &&
            support.every(({ crossing, letters }) =>
              letters.has(words[candidate]!.grid[crossing.offset]),
            ),
        );
        if (after.length !== before.length) {
          state[index] = after;
          stats.domainPrunes += before.length - after.length;
          changed = true;
        }
        if (!after.length) {
          dead(index, state);
          return "dead";
        }
      }
    }
    return "consistent";
  };
  const random = randomSource(options.seed);
  let solution: number[][] = [];
  const search = (state: number[][], depth: number): "found" | "dead" | "limit" => {
    if (expired()) return "limit";
    if (stats.nodes >= options.nodeLimit) {
      limit = "node";
      return "limit";
    }
    stats.nodes++;
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    const propagated = propagate(state);
    if (propagated !== "consistent") return propagated;
    let chosen = -1;
    for (let index = 0; index < state.length; index++) {
      if (
        state[index]!.length > 1 &&
        (chosen < 0 || state[index]!.length < state[chosen]!.length)
      )
        chosen = index;
    }
    if (chosen < 0) {
      solution = state;
      return "found";
    }
    const order = [...state[chosen]!];
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [order[index], order[other]] = [order[other]!, order[index]!];
    }
    for (const candidate of order) {
      const next = state.map((domain) => [...domain]);
      next[chosen] = [candidate];
      const outcome = search(next, depth + 1);
      if (outcome !== "dead") return outcome;
      stats.backtracks++;
    }
    return "dead";
  };
  const outcome = search(domains, 0);
  if (outcome === "found")
    return result(
      "solved",
      grid.slots.map((slot, index) => ({
        slotId: slot.id,
        entryId: words[solution[index]![0]!]!.id,
      })),
    );
  return result(outcome === "limit" ? "budget-exhausted" : "unsatisfiable");
}
