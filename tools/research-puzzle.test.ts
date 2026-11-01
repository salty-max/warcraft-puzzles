import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fixture } from "../packages/content/test/fixture.ts";
import { entryEvidenceDigest } from "../packages/content/src/index.ts";
import { prepareResearchPuzzle, ResearchPuzzleSchema } from "./research-puzzle.ts";
const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const raw = read("content/puzzles/first-steps.json");
const editorial = read("content/seed/editorial.json");
const snapshot = read("content/seed/evidence.json");
function synthetic(length: number) {
  const { editorial, snapshot, entry } = fixture();
  const words =
    length === 5
      ? ["ABCDE", "AKLMF", "ENOPJ", "FGHIJ"]
      : ["ABCDEF", "AGHIKJ", "FLMNOP", "JKLMNP"];
  editorial.entries = words.map((word, i) => {
    const next = structuredClone(entry);
    next.id = `word-${i}`;
    next.answer = { ...next.answer, display: word, grid: word, enumeration: [length] };
    next.review.evidenceDigest = entryEvidenceDigest(next, snapshot);
    return next;
  });
  const rows = [
    ".".repeat(length),
    ...Array<string>(length - 2).fill(`.${"#".repeat(length - 2)}.`),
    ".".repeat(length),
  ];
  return {
    editorial,
    snapshot,
    raw: {
      id: "frame",
      title: "Synthetic",
      status: "research",
      format: "partially-checked",
      coldSolve: null,
      layout: { id: "frame", rows },
      placements: ["1A", "1D", "2D", "3A"].map((slotId, i) => ({
        slotId,
        entryId: `word-${i}`,
      })),
    },
  };
}
describe("authored construction trial", () => {
  it("validates and projects the entire candidate without granting an approval", () => {
    const result = prepareResearchPuzzle(raw, editorial, snapshot);
    expect(result.playable.entries).toHaveLength(12);
    expect(result.grid.whiteCells).toHaveLength(47);
    expect(
      result.measurements.every((m) => m.checked >= 2 && m.checked / m.length >= 0.4),
    ).toBe(true);
    expect(result.puzzle.coldSolve).toBeNull();
    expect(
      result.playable.entries.find((e) => e.answer === "MOLTENCORE")?.enumeration,
    ).toEqual([6, 4]);
    expect(JSON.stringify(result.playable)).not.toContain("excerpt");
    expect(prepareResearchPuzzle(raw, editorial, snapshot).playable.fingerprint).toBe(
      result.playable.fingerprint,
    );
  });
  it("rejects partial fills, unknown references and invalid catalogues", () => {
    const puzzle = ResearchPuzzleSchema.parse(raw);
    expect(() =>
      prepareResearchPuzzle(
        { ...puzzle, placements: puzzle.placements.slice(1) },
        editorial,
        snapshot,
      ),
    ).toThrow("Missing");
    expect(() =>
      prepareResearchPuzzle(
        {
          ...puzzle,
          placements: puzzle.placements.map((p) => ({ ...p, entryId: "missing" })),
        },
        editorial,
        snapshot,
      ),
    ).toThrow("Unknown");
    const invalid = fixture();
    invalid.entry.review.evidenceDigest = "a".repeat(64);
    expect(() =>
      prepareResearchPuzzle(raw, invalid.editorial, invalid.snapshot),
    ).toThrow("Invalid research catalogue");
  });
  it("excludes rejected content and fails if selected entries are unavailable", () => {
    const f = synthetic(5);
    f.editorial.entries[0]!.status = "rejected";
    expect(() => prepareResearchPuzzle(f.raw, f.editorial, f.snapshot)).toThrow(
      "Unknown",
    );
  });
  it("binds the local save identity to wording and forbids direct prompt leaks", () => {
    const a = synthetic(5);
    const original = prepareResearchPuzzle(a.raw, a.editorial, a.snapshot).playable
      .fingerprint;
    a.editorial.entries[0]!.clue.text = "A different prompt";
    expect(
      prepareResearchPuzzle(a.raw, a.editorial, a.snapshot).playable.fingerprint,
    ).not.toBe(original);
    a.editorial.entries[0]!.hint.text = "Synthetic token XAKLMFY";
    expect(() => prepareResearchPuzzle(a.raw, a.editorial, a.snapshot)).not.toThrow();
    a.editorial.entries[0]!.hint.text = "???";
    expect(() => prepareResearchPuzzle(a.raw, a.editorial, a.snapshot)).not.toThrow();
    a.editorial.entries[0]!.hint.text = "The answer to another clue is AKLMF";
    expect(() => prepareResearchPuzzle(a.raw, a.editorial, a.snapshot)).toThrow(
      "discloses",
    );
  });
  it("rejects a complete arrangement with too few helpful crossings", () => {
    const f = synthetic(6);
    expect(() => prepareResearchPuzzle(f.raw, f.editorial, f.snapshot)).toThrow("40%");
  });
});
