import { describe, expect, it } from "vitest";
import { compileLayout, InvalidLayoutError, inspectFill } from "../src/index.ts";

import { mini, bank, placements } from "./fixture.ts";

describe("layout contract", () => {
  it("numbers shared starts in reading order and gives reciprocal crossings", () => {
    const grid = compileLayout(mini);
    expect(grid.slots.map(({ id, cells }) => [id, cells])).toEqual([
      ["1A", [0, 1, 2]],
      ["1D", [0, 3, 6]],
      ["2D", [1, 4, 7]],
      ["3D", [2, 5, 8]],
      ["4A", [3, 4, 5]],
      ["5A", [6, 7, 8]],
    ]);
    for (const [index, slot] of grid.slots.entries()) {
      for (const crossing of slot.crossings) {
        const other = grid.slots[crossing.other]!;
        expect(other.cells[crossing.otherOffset]).toBe(slot.cells[crossing.offset]);
        expect(other.direction).not.toBe(slot.direction);
        expect(other.crossings).toContainEqual({
          other: index,
          offset: crossing.otherOffset,
          otherOffset: crossing.offset,
        });
      }
    }
  });

  it("accepts rectangular grids and counts blocks without requiring symmetry", () => {
    const grid = compileLayout({
      id: "rectangle",
      rows: ["#....", ".....", ".....", "....."],
    });
    expect([grid.width, grid.height, grid.whiteCells.length]).toEqual([5, 4, 19]);
    expect(grid.slots).toHaveLength(9);
  });

  it.each([
    ["rectangle", ["...", "....", "..."]],
    ["empty", ["###", "###", "###"]],
    ["disconnected", ["...#...", "...#...", "...#..."]],
    ["short-run", ["...", ".#.", "..."]],
    ["short-run", ["....", "....", "##..", "##.."]],
  ])("rejects %s", (code, rows) => {
    try {
      compileLayout({ id: "invalid", rows });
      throw new Error("Expected rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidLayoutError);
      expect((error as InvalidLayoutError).issues.map((issue) => issue.code)).toContain(
        code,
      );
    }
  });

  it.each([
    [],
    ["..", "..", ".."],
    ["...", "ABC", "..."],
    Array<string>(26).fill("..."),
  ])("rejects malformed dimensions or characters", (rows) => {
    expect(() => compileLayout({ id: "invalid", rows })).toThrow();
  });
});

describe("independent fill validation", () => {
  it("renders a complete crossing-consistent solution", () => {
    expect(inspectFill(mini, bank, placements)).toEqual({
      issues: [],
      rows: ["ABC", "DEF", "GHI"],
    });
  });
  it("detects missing/unknown references and duplicate slots", () => {
    const result = inspectFill(mini, bank, [
      ...placements.slice(1),
      placements[1]!,
      { slotId: "99A", entryId: "word-0" },
      { slotId: "1A", entryId: "unknown" },
    ]);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["unknown-reference", "missing-slot", "duplicate-slot"]),
    );
  });
  it("detects wrong lengths, crossing conflicts and repeated normalised answers", () => {
    const alternatives = [
      ...bank,
      { id: "other-clue", grid: "ABC" },
      { id: "long", grid: "ABCD" },
    ];
    const changed = placements.map((placement) =>
      placement.slotId === "4A"
        ? { ...placement, entryId: "other-clue" }
        : placement.slotId === "5A"
          ? { ...placement, entryId: "long" }
          : placement,
    );
    expect(
      inspectFill(mini, alternatives, changed).issues.map((issue) => issue.code),
    ).toEqual(expect.arrayContaining(["length", "crossing", "repeated-answer"]));
  });
  it("preserves black squares in rendered fills", () => {
    const layout = { id: "blocked", rows: ["#...", "....", "....", "...."] };
    const words = ["ABC", "DEFG", "HIJK", "LMNO", "DHL", "AEIM", "BFJN", "CGKO"].map(
      (grid, i) => ({ id: `word-${i}`, grid }),
    );
    const grid = compileLayout(layout);
    const rows = ["#ABC", "DEFG", "HIJK", "LMNO"];
    const filled = grid.slots.map((slot) => ({
      slotId: slot.id,
      entryId: words.find(
        (word) =>
          word.grid ===
          slot.cells.map((cell) => rows[Math.floor(cell / 4)]![cell % 4]).join(""),
      )!.id,
    }));
    expect(inspectFill(layout, words, filled)).toEqual({ issues: [], rows });
  });
});
