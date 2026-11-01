import { describe, expect, it } from "vitest";
import {
  checkingFloorIssues,
  compilePartiallyCheckedLayout,
  crossingsNeeded,
} from "../src/index.ts";

describe("checking floor", () => {
  it("scales with length: 40% up to seven letters, three beyond", () => {
    expect([3, 5, 6, 7, 8, 12, 15].map(crossingsNeeded)).toEqual([2, 2, 3, 3, 3, 3, 3]);
  });
  it("accepts a frame whose answers are all checked often enough", () => {
    const frame = compilePartiallyCheckedLayout({
      id: "frame",
      rows: [".....", ".###.", ".###.", ".###.", "....."],
    });
    expect(checkingFloorIssues(frame)).toEqual([]);
  });
  it("flags an answer with too few crossings", () => {
    const grid = compilePartiallyCheckedLayout({
      id: "ladder",
      rows: [".....", ".###.", "....."],
    });
    // 1A and 3A are crossed twice (two downs), the downs are only three long
    expect(checkingFloorIssues(grid)).toEqual([]);
    const thin = compilePartiallyCheckedLayout({
      id: "thin",
      rows: ["....", ".###", "...."].map((row) => row),
    });
    expect(checkingFloorIssues(thin).length).toBeGreaterThan(0);
  });
  it("flags a long unchecked stretch even when the count is met", () => {
    const grid = compilePartiallyCheckedLayout({
      id: "gap",
      rows: ["............", ".#.#######.#", ".#.#######.#", "............"],
    });
    expect(
      checkingFloorIssues(grid).filter((issue) => issue.message.includes("unchecked")),
    ).toHaveLength(2);
  });
});
