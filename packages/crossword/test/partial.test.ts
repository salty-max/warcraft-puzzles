import { describe, expect, it } from "vitest";
import {
  compileLayout,
  compilePartiallyCheckedLayout,
  inspectPartiallyCheckedFill,
} from "../src/index.ts";
const frame = { id: "frame", rows: [".....", ".###.", ".###.", ".###.", "....."] };
const bank = ["ABCDE", "AKLMF", "ENOPJ", "FGHIJ"].map((grid, i) => ({
  id: `word-${i}`,
  grid,
}));
const placements = ["1A", "1D", "2D", "3A"].map((slotId, i) => ({
  slotId,
  entryId: `word-${i}`,
}));
describe("explicit partially checked format", () => {
  it("keeps the default compiler strict", () => {
    expect(() => compileLayout(frame)).toThrow();
    const grid = compilePartiallyCheckedLayout(frame);
    expect(grid.slots.map((s) => s.id)).toEqual(["1A", "1D", "2D", "3A"]);
    expect(grid.slots.map((s) => s.crossings.length)).toEqual([2, 2, 2, 2]);
    expect(grid.whiteCells).toHaveLength(16);
    expect(inspectPartiallyCheckedFill(frame, bank, placements)).toEqual({
      issues: [],
      rows: ["ABCDE", "K###N", "L###O", "M###P", "FGHIJ"],
    });
  });
  it("retains complete-fill, conflict and uniqueness checks", () => {
    expect(
      inspectPartiallyCheckedFill(frame, bank, placements.slice(1)).issues.some(
        (i) => i.code === "missing-slot",
      ),
    ).toBe(true);
    expect(
      inspectPartiallyCheckedFill(
        frame,
        bank,
        placements.map((p) => (p.slotId === "1D" ? { ...p, entryId: "word-0" } : p)),
      ).issues.map((i) => i.code),
    ).toEqual(expect.arrayContaining(["crossing", "repeated-answer"]));
  });
  it("rejects isolated white cells, two-letter runs and disconnected regions", () => {
    expect(() =>
      compilePartiallyCheckedLayout({ id: "orphan", rows: ["###", "#.#", "###"] }),
    ).toThrow("Every white cell");
    expect(() =>
      compilePartiallyCheckedLayout({ id: "two", rows: ["..#", ".##", ".##"] }),
    ).toThrow("at least three");
    expect(() =>
      compilePartiallyCheckedLayout({
        id: "split",
        rows: ["...#...", "#######", "#######"],
      }),
    ).toThrow("connected");
  });
});
