import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  checkingFloorIssues,
  compilePartiallyCheckedLayout,
} from "../packages/crossword/src/index.ts";
import { BenchmarkConfigSchema } from "./benchmark.ts";
import { prepareResearchPuzzle } from "./research-puzzle.ts";

const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const editorial = read("content/seed/editorial.json");
const snapshot = read("content/seed/evidence.json");

describe("layouts drawn for the rebuilt bank", () => {
  const config = BenchmarkConfigSchema.parse(read("content/benchmarks/layouts.json"));
  const layouts = config.layouts.filter((layout) => layout.id.startsWith("bank-"));
  it("meet the checking floor and need no three or four letter answer", () => {
    expect(layouts.length).toBeGreaterThanOrEqual(7);
    for (const layout of layouts) {
      const grid = compilePartiallyCheckedLayout({ id: layout.id, rows: layout.rows });
      expect(checkingFloorIssues(grid)).toEqual([]);
      expect(grid.slots.every((slot) => slot.length >= 5)).toBe(true);
    }
  });
});

describe("the playset", () => {
  const days = ["play-1", "play-2", "play-3"].map((id) =>
    prepareResearchPuzzle(read(`content/puzzles/${id}.json`), editorial, snapshot),
  );
  it("loads through the research validator", () => {
    for (const day of days) expect(day.playable.entries.length).toBeGreaterThan(9);
  });
  it("repeats no answer from one day to the next", () => {
    const seen = new Set<string>();
    for (const day of days)
      for (const entry of day.playable.entries) {
        expect(seen.has(entry.answer)).toBe(false);
        seen.add(entry.answer);
      }
  });
});
