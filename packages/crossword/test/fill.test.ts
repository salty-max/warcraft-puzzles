import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  distinctCandidates,
  fillGrid,
  inspectFill,
  parseCandidates,
} from "../src/index.ts";
import { mini, bank } from "./fixture.ts";

const options = { seed: 20261101, nodeLimit: 10000 };
const binaryWords = ["AAA", "AAB", "ABA", "ABB", "BAA", "BAB", "BBA", "BBB"];
const candidates = (words: string[]) =>
  words.map((grid, index) => ({ id: `word-${index}`, grid }));

// Enumerate row triples, then derive columns. This oracle does not use slots,
// arc consistency, the search's heuristic or its solution validator.
function bruteForce(words: string[]) {
  for (const a of words)
    for (const b of words)
      for (const c of words) {
        const six = [a, b, c, ...[0, 1, 2].map((i) => a[i]! + b[i]! + c[i]!)];
        if (new Set(six).size === 6 && six.every((word) => words.includes(word)))
          return true;
      }
  return false;
}

describe("bounded deterministic fill search", () => {
  it("finds a complete fill and leaves its inputs unchanged", () => {
    const before = JSON.stringify([mini, bank]);
    const result = fillGrid(mini, bank, options);
    expect(result.status).toBe("solved");
    expect(result.limit).toBeNull();
    expect(result.placements).toHaveLength(6);
    expect(inspectFill(mini, bank, result.placements).issues).toEqual([]);
    expect(JSON.stringify([mini, bank])).toBe(before);
  });

  it("keeps results reproducible across repeated and shuffled-input runs", () => {
    const words = candidates(binaryWords);
    const result = fillGrid(mini, words, { ...options, seed: 0xffffffff });
    expect(result.status).toBe("solved");
    expect(
      fillGrid(mini, [...words].reverse(), { ...options, seed: 0xffffffff }),
    ).toEqual(result);
    expect(fillGrid(mini, words, { ...options, seed: 0xffffffff })).toEqual(result);
    expect(result.stats.maxDepth).toBeGreaterThan(0);
  });

  it("reports distinct-word length shortages without searching", () => {
    const result = fillGrid(
      mini,
      [
        { id: "a", grid: "ABC" },
        { id: "b", grid: "ABC" },
      ],
      options,
    );
    expect(result.status).toBe("unsatisfiable");
    expect(result.stats.nodes).toBe(0);
    expect(result.diagnostics.lengthDeficits).toEqual([
      { length: 3, slots: 6, words: 1, missing: 5 },
    ]);
    expect(fillGrid(mini, [], options).diagnostics.lengthDeficits[0]!.missing).toBe(6);
  });

  it("proves crossing infeasibility after passing length preflight", () => {
    const result = fillGrid(
      mini,
      candidates(["AAA", "AAB", "AAC", "AAD", "AAE", "AAF"]),
      options,
    );
    expect(result.status).toBe("unsatisfiable");
    expect(result.diagnostics.lengthDeficits).toEqual([]);
    expect(result.diagnostics.deadEnds.length).toBeGreaterThan(0);
    expect(result.placements).toEqual([]);
  });

  it("does not call a budget-limited search impossible", () => {
    const result = fillGrid(mini, candidates(binaryWords), { seed: 0, nodeLimit: 1 });
    expect(result.status).toBe("budget-exhausted");
    expect(result.limit).toBe("node");
    expect(result.stats.nodes).toBe(1);
    expect(result.placements).toEqual([]);
  });

  it("supports a wall-clock guard with a deterministic test clock", () => {
    let tick = 0;
    const result = fillGrid(mini, bank, { ...options, timeLimitMs: 1 }, () => tick++);
    expect(result.status).toBe("budget-exhausted");
    expect(result.limit).toBe("time");
    expect(result.stats.nodes).toBe(0);
  });

  it("can stop during propagation rather than waiting for another branch", () => {
    let tick = 0;
    const result = fillGrid(mini, bank, { ...options, timeLimitMs: 3 }, () => tick++);
    expect(result.status).toBe("budget-exhausted");
    expect(result.stats.nodes).toBe(1);
  });

  it.each([
    { seed: -1, nodeLimit: 10 },
    { seed: 0, nodeLimit: 0 },
    { seed: 0.5, nodeLimit: 10 },
    { seed: 0, nodeLimit: 10, timeLimitMs: 0 },
  ])("rejects invalid search limits", (input) => {
    expect(() => fillGrid(mini, bank, input)).toThrow();
  });

  it("agrees with exhaustive enumeration across small synthetic banks", () => {
    fc.assert(
      fc.property(fc.subarray(binaryWords), (words) => {
        const result = fillGrid(mini, candidates(words), options);
        expect(result.status).toBe(bruteForce(words) ? "solved" : "unsatisfiable");
        if (result.status === "solved")
          expect(
            inspectFill(mini, candidates(words), result.placements).issues,
          ).toEqual([]);
      }),
      { seed: 20261101, numRuns: 100 },
    );
  });

  it("recovers generated valid squares with distinct rows and columns", () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray([..."ABCDEFGHI"], { minLength: 9, maxLength: 9 }),
        (letters) => {
          const rows = [
            letters.slice(0, 3).join(""),
            letters.slice(3, 6).join(""),
            letters.slice(6, 9).join(""),
          ];
          const words = [
            ...rows,
            ...[0, 1, 2].map((i) => rows.map((row) => row[i]).join("")),
          ];
          const entries = candidates(words);
          const result = fillGrid(mini, entries, options);
          expect(result.status).toBe("solved");
          expect(inspectFill(mini, entries, result.placements).issues).toEqual([]);
        },
      ),
      { seed: 20261101, numRuns: 50 },
    );
  });
});

describe("answer identity", () => {
  it("chooses a stable clue representative without counting aliases twice", () => {
    expect(
      distinctCandidates([
        { id: "z", grid: "KIRINTOR" },
        { id: "a", grid: "KIRINTOR" },
        { id: "b", grid: "BAT" },
      ]),
    ).toEqual([
      { id: "b", grid: "BAT" },
      { id: "a", grid: "KIRINTOR" },
    ]);
  });
  it("rejects ambiguous IDs and non-normalised grid forms", () => {
    expect(() =>
      parseCandidates([
        { id: "same", grid: "ABC" },
        { id: "same", grid: "DEF" },
      ]),
    ).toThrow("Duplicate candidate ID");
    expect(() => parseCandidates([{ id: "spaced", grid: "Kirin Tor" }])).toThrow();
  });
  it("uses all letters of multi-word answers, retaining their content identity", () => {
    const layout = { id: "long", rows: Array<string>(8).fill("........") };
    const result = fillGrid(layout, [{ id: "kirintor", grid: "KIRINTOR" }], options);
    expect(result.diagnostics.lengthDeficits).toEqual([
      { length: 8, slots: 16, words: 1, missing: 15 },
    ]);
    const rows = [
      "KIRINTOR",
      "ABCDEFGH",
      "IJKLMNOP",
      "QRSTUVWX",
      "YZABCDEF",
      "GHIJKLMN",
      "OPQRSTUV",
      "WXYZABCD",
    ];
    const words = [
      ...rows,
      ...Array.from({ length: 8 }, (_, i) => rows.map((row) => row[i]).join("")),
    ];
    const entries = candidates(words).map((entry) =>
      entry.grid === "KIRINTOR" ? { ...entry, id: "kirintor" } : entry,
    );
    const filled = fillGrid(layout, entries, options);
    expect(filled.status).toBe("solved");
    expect(
      filled.placements.some((placement) => placement.entryId === "kirintor"),
    ).toBe(true);
    expect(inspectFill(layout, entries, filled.placements).issues).toEqual([]);
  });
});
