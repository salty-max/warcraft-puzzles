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

it("searches partial layouts and validates the resulting letters independently", async () => {
  const { fillPartiallyCheckedGrid } = await import("../src/index.ts");
  const result = fillPartiallyCheckedGrid(frame, bank, { seed: 42, nodeLimit: 1000 });
  expect(result.status).toBe("solved");
  expect(inspectPartiallyCheckedFill(frame, bank, result.placements).issues).toEqual(
    [],
  );
  expect(
    fillPartiallyCheckedGrid(frame, bank.slice(0, 3), { seed: 42, nodeLimit: 1000 })
      .status,
  ).toBe("unsatisfiable");
});

it("matches an independent exhaustive oracle on generated partial-frame banks", async () => {
  const fc = await import("fast-check");
  const { fillPartiallyCheckedGrid } = await import("../src/index.ts");
  const layout = { id: "small-frame", rows: ["...", ".#.", "..."] };
  const words = ["AAA", "AAB", "ABA", "ABB", "BAA", "BAB", "BBA", "BBB"];
  fc.assert(
    fc.property(fc.subarray(words), (subset) => {
      const exists = subset.some((a) =>
        subset.some((b) =>
          subset.some((c) =>
            subset.some(
              (d) =>
                new Set([a, b, c, d]).size === 4 &&
                a[0] === b[0] &&
                a[2] === c[0] &&
                b[2] === d[0] &&
                c[2] === d[2],
            ),
          ),
        ),
      );
      const bank = subset.map((grid, i) => ({ id: `word-${i}`, grid }));
      const result = fillPartiallyCheckedGrid(layout, bank, {
        seed: 42,
        nodeLimit: 10000,
      });
      expect(result.status).toBe(exists ? "solved" : "unsatisfiable");
      if (exists)
        expect(
          inspectPartiallyCheckedFill(layout, bank, result.placements).issues,
        ).toEqual([]);
    }),
    { seed: 20261101, numRuns: 100 },
  );
  expect(
    fillPartiallyCheckedGrid(
      layout,
      words.map((grid, i) => ({ id: `word-${i}`, grid })),
      { seed: 42, nodeLimit: 1 },
    ).status,
  ).toBe("budget-exhausted");
});
