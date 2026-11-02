import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  checkingFloorIssues,
  compilePartiallyCheckedLayout,
} from "../packages/crossword/src/index.ts";
import { BenchmarkConfigSchema, twinsOf } from "./benchmark.ts";
import { EditorialSchema } from "../packages/content/src/index.ts";
import { prepareResearchPuzzle } from "./research-puzzle.ts";

const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const editorial = read("content/seed/editorial.json");
const snapshot = read("content/seed/evidence.json");

describe("layouts drawn for the rebuilt bank", () => {
  const config = BenchmarkConfigSchema.parse(read("content/benchmarks/layouts.json"));
  const layouts = config.layouts.filter((layout) => layout.id.startsWith("bank-"));
  const counts = layouts.map((layout) => {
    const grid = compilePartiallyCheckedLayout({ id: layout.id, rows: layout.rows });
    const count = (from: number, to: number) =>
      grid.slots.filter((slot) => slot.length >= from && slot.length <= to).length;
    return { layout, grid, count };
  });
  it("meet the checking floor and each slot-length bound", () => {
    expect(layouts).toHaveLength(14);
    for (const { grid, count } of counts) {
      expect(checkingFloorIssues(grid)).toEqual([]);
      expect(count(3, 99)).toBeGreaterThanOrEqual(7);
      expect(count(3, 99)).toBeLessThanOrEqual(11);
      expect(count(5, 5)).toBeLessThanOrEqual(1);
      expect(count(3, 4)).toBeGreaterThanOrEqual(1);
      expect(count(3, 4)).toBeLessThanOrEqual(3);
      expect(count(6, 6)).toBeLessThanOrEqual(2);
      expect(count(11, 99)).toBeLessThanOrEqual(2);
      expect(count(7, 13)).toBeGreaterThanOrEqual(5);
    }
  });
  it("vary: some spend a five-letter answer and some do not, in several sizes", () => {
    const withFive = counts.filter(({ count }) => count(5, 5) === 1).length;
    expect(withFive).toBeGreaterThanOrEqual(3);
    expect(counts.length - withFive).toBeGreaterThanOrEqual(8);
    const sizes = new Set(
      layouts.map((layout) => `${layout.rows[0]!.length}x${layout.rows.length}`),
    );
    expect(sizes.size).toBeGreaterThanOrEqual(3);
    // Glue ran dry first: the family may not drift above today's 1.5 a day (supply 0.9).
    const glue =
      counts.reduce((sum, { count }) => sum + count(3, 4), 0) / counts.length;
    expect(glue).toBeLessThanOrEqual(1.5);
    const answers = counts.map(({ count }) => count(3, 99));
    expect(Math.max(...answers) - Math.min(...answers)).toBeGreaterThanOrEqual(3);
  });
});

describe("the playset", () => {
  const days = [1, 2, 3, 4, 5, 6, 7, 8]
    .map((day) => `play-${day}`)
    .map((id) =>
      prepareResearchPuzzle(read(`content/puzzles/${id}.json`), editorial, snapshot),
    );
  it("loads through the research validator", () => {
    for (const day of days)
      expect(day.playable.entries.length).toBeGreaterThanOrEqual(7);
  });
  it("repeats no answer from one day to the next", () => {
    const seen = new Set<string>();
    for (const day of days)
      for (const entry of day.playable.entries) {
        expect(seen.has(entry.answer)).toBe(false);
        seen.add(entry.answer);
      }
  });
  it("keeps twins out of every day", () => {
    const live = EditorialSchema.parse(editorial).entries.filter(
      (entry) => entry.status !== "draft" && entry.status !== "rejected",
    );
    const conflicts = twinsOf(live);
    for (const day of days) {
      const answers = new Set(day.playable.entries.map((entry) => entry.answer));
      for (const answer of answers)
        for (const twin of conflicts[answer] ?? [])
          expect(answers.has(twin)).toBe(false);
    }
  });
});
