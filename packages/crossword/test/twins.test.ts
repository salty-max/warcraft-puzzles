import { describe, expect, it } from "vitest";
import { fillPartiallyCheckedGrid, twinConflicts } from "../src/index.ts";

const entries = [
  { grid: "NOVA", text: ["A frost spell"], rows: ["spell-1"] },
  { grid: "FROSTNOVA", text: ["Freezes foes"], rows: ["spell-2"] },
  { grid: "ARTHAS", text: ["Prince of Lordaeron"], rows: ["book-1"] },
  { grid: "LICHKING", text: ["Arthas took the blade"], rows: ["book-2"] },
  { grid: "SYLVANAS", text: ["Ranger"], rows: ["book-3"] },
  { grid: "THRALL", text: ["Warchief"], rows: ["book-3"] },
  { grid: "GROM", text: ["An orc"], rows: ["a"] },
];

describe("twin conflicts", () => {
  const conflicts = twinConflicts(entries);
  it("pairs a head or tail, a spelt-out answer and a shared row, both ways", () => {
    expect(conflicts.NOVA).toEqual(["FROSTNOVA"]);
    expect(conflicts.FROSTNOVA).toEqual(["NOVA"]);
    expect(conflicts.LICHKING).toEqual(["ARTHAS"]);
    expect(conflicts.SYLVANAS).toEqual(["THRALL"]);
  });
  it("leaves unrelated answers alone", () => {
    expect(conflicts.GROM).toBeUndefined();
  });
});

describe("fill with conflicts", () => {
  const frame = { id: "frame", rows: [".....", ".###.", ".###.", ".###.", "....."] };
  const words = ["ABCDE", "AKLMF", "ENOPJ", "FGHIJ"].map((grid, i) => ({
    id: `w${i}`,
    grid,
  }));
  const options = { seed: 1, nodeLimit: 1000 };
  it("solves the frame, then refuses it when two of its answers are twins", () => {
    expect(fillPartiallyCheckedGrid(frame, words, options).status).toBe("solved");
    const twins = { ABCDE: ["FGHIJ"] };
    const refused = fillPartiallyCheckedGrid(frame, words, {
      ...options,
      conflicts: twins,
    });
    expect(refused.status).toBe("unsatisfiable");
  });
  it("ignores conflicts that name no candidate or the word itself", () => {
    const harmless = { ABCDE: ["ABCDE", "NOSUCH"], NOSUCH: ["ABCDE"] };
    expect(
      fillPartiallyCheckedGrid(frame, words, { ...options, conflicts: harmless })
        .status,
    ).toBe("solved");
  });
  it("steers the fill to a twin-free alternative when one exists", () => {
    const spare = [...words, { id: "w4", grid: "FXYZJ" }];
    const steered = fillPartiallyCheckedGrid(frame, spare, {
      ...options,
      conflicts: { ABCDE: ["FGHIJ"] },
    });
    expect(steered.status).toBe("solved");
    expect(steered.placements.find((p) => p.slotId === "3A")?.entryId).toBe("w4");
  });
});
