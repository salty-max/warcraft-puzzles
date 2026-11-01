import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  freshState,
  restoreState,
  enterAnswer,
  useHint,
  revealAnswer,
  checkAnswers,
  entryPattern,
  solutionLetters,
  wrongCells,
  entryAt,
  startCursor,
  typeLetter,
  backspace,
  toggleDirection,
  moveArrow,
  describeCursor,
} from "./model.ts";
import type { PlayEntry, PlayPuzzle } from "./model.ts";
const puzzle: PlayPuzzle = {
  id: "test",
  title: "Test",
  fingerprint: "test",
  width: 3,
  height: 3,
  rows: ["...", ".##", ".##"],
  entries: [
    {
      id: "1A",
      number: 1,
      direction: "across",
      cells: [0, 1, 2],
      answer: "ABC",
      enumeration: [3],
      clue: "First",
      hint: "One",
    },
    {
      id: "1D",
      number: 1,
      direction: "down",
      cells: [0, 3, 6],
      answer: "ADE",
      enumeration: [3],
      clue: "Second",
      hint: "Two",
    },
  ],
};
const across = puzzle.entries[0]!;
const down = puzzle.entries[1]!;
describe("trial player state", () => {
  it("enters whole answers, preserves crossing identity, truncates and clears", () => {
    const fresh = freshState(puzzle);
    const a = enterAnswer(fresh, across, "a-b c extra");
    const b = enterAnswer(a, down, "Ade");
    expect(fresh.letters.every((l) => !l)).toBe(true);
    expect(entryPattern(across, b)).toBe("ABC");
    expect(checkAnswers(puzzle, b)).toEqual({ correct: 2, solved: true });
    const edited = enterAnswer(b, across, "X");
    expect(entryPattern(down, edited)).toBe("XDE");
    expect(entryPattern(across, edited)).toBe("X··");
    expect(checkAnswers(puzzle, edited)).toEqual({ correct: 0, solved: false });
  });
  it("counts distinct hints and reveals without losing earlier assistance", () => {
    const hinted = useHint(useHint(freshState(puzzle), "1A"), "1A");
    expect(hinted.hinted).toEqual(["1A"]);
    const revealed = revealAnswer(revealAnswer(hinted, down), down);
    expect(revealed.revealed).toEqual(["1D"]);
    expect(revealed.hinted).toEqual(["1A"]);
    expect(checkAnswers(puzzle, revealed)).toEqual({ correct: 1, solved: false });
  });
  it("round-trips valid saves without sharing mutable arrays", () => {
    const state = {
      ...revealAnswer(useHint(freshState(puzzle), "1A"), down),
      checks: 3,
    };
    const restored = restoreState(puzzle, JSON.parse(JSON.stringify(state)));
    expect(restored).toEqual(state);
    restored.letters[0] = "X";
    expect(state.letters[0]).toBe("A");
  });
  it.each([
    null,
    [],
    1,
    {},
    { letters: [] },
    { ...freshState(puzzle), checks: -1 },
    { ...freshState(puzzle), checks: 0.2 },
    { ...freshState(puzzle), hinted: ["unknown"] },
    { ...freshState(puzzle), revealed: ["1A", "1A"] },
    { ...freshState(puzzle), letters: ["a", "", "", "", "", "", "", "", ""] },
    { ...freshState(puzzle), letters: ["", "", "", "", "X", "", "", "", ""] },
  ])("resets malformed or incompatible saves: %j", (input) => {
    expect(restoreState(puzzle, input)).toEqual(freshState(puzzle));
  });
  it("never accepts invalid letters or changes blocks under arbitrary text edits", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const state = enterAnswer(freshState(puzzle), across, text);
        expect(state.letters.every((letter) => /^[A-Z]?$/.test(letter))).toBe(true);
        expect(state.letters.slice(3)).toEqual(Array<string>(6).fill(""));
        expect(restoreState(puzzle, state)).toEqual(state);
      }),
      { seed: 20261101, numRuns: 100 },
    );
  });
});

describe("typing in the grid", () => {
  const fresh = freshState(puzzle);
  it("knows the solution and which letters are wrong", () => {
    expect(solutionLetters(puzzle)).toEqual(["A", "B", "C", "D", "", "", "E", "", ""]);
    const state = enterAnswer(enterAnswer(fresh, across, "AXC"), down, "ADZ");
    expect(wrongCells(puzzle, state)).toEqual([1, 6]);
    expect(wrongCells(puzzle, fresh)).toEqual([]);
  });
  it("starts at the first empty square, else the first", () => {
    expect(startCursor(fresh, down).cell).toBe(0);
    const filled = enterAnswer(fresh, down, "A");
    expect(startCursor(filled, down).cell).toBe(3);
    const full = enterAnswer(fresh, down, "ADE");
    expect(startCursor(full, down).cell).toBe(0);
  });
  it("picks the entry in the preferred direction, else any", () => {
    expect(entryAt(puzzle, 0, "down")).toBe(down);
    expect(entryAt(puzzle, 0, "across")).toBe(across);
    expect(entryAt(puzzle, 3, "across")).toBe(down);
    expect(entryAt(puzzle, 4, "across")).toBeUndefined();
  });
  it("keeps the crossing's letter when a neighbouring word is typed", () => {
    let state = enterAnswer(fresh, down, "ADE");
    let cursor = startCursor(state, across);
    expect(cursor.cell).toBe(1);
    for (const letter of "bc") ({ state, cursor } = typeLetter(state, cursor, letter));
    expect(state.letters.slice(0, 3)).toEqual(["A", "B", "C"]);
    expect(state.letters[3]).toBe("D");
    expect(state.letters[6]).toBe("E");
  });
  it("advances, stops at the end and ignores anything that is not a letter", () => {
    let state = fresh;
    let cursor = startCursor(state, across);
    for (const letter of "ab1 c-d")
      ({ state, cursor } = typeLetter(state, cursor, letter));
    expect(state.letters.slice(0, 3)).toEqual(["A", "B", "D"]);
    expect(cursor.cell).toBe(2);
    expect(typeLetter(state, cursor, "é")).toEqual({ state, cursor });
  });
  it("deletes this square, else steps back and deletes", () => {
    let state = enterAnswer(fresh, across, "ABC");
    let cursor = { entry: across, cell: 2 };
    ({ state, cursor } = backspace(state, cursor));
    expect([state.letters[2], cursor.cell]).toEqual(["", 2]);
    ({ state, cursor } = backspace(state, cursor));
    expect([state.letters[1], cursor.cell]).toEqual(["", 1]);
    state = backspace(state, { entry: across, cell: 0 }).state;
    expect(state.letters[0]).toBe("");
    const empty = backspace(fresh, { entry: across, cell: 0 });
    expect(empty.state).toBe(fresh);
  });
  it("turns at a crossing and nowhere else", () => {
    const turned = toggleDirection(puzzle, { entry: across, cell: 0 });
    expect(turned.entry).toBe(down);
    expect(toggleDirection(puzzle, turned).entry).toBe(across);
    const plain = { entry: across, cell: 2 };
    expect(toggleDirection(puzzle, plain)).toBe(plain);
  });
  it("turns first, then walks over blocks and stops at the edge", () => {
    const start = { entry: across, cell: 0 };
    expect(moveArrow(puzzle, start, "down")).toEqual({ entry: down, cell: 0 });
    expect(moveArrow(puzzle, start, "right")).toEqual({ entry: across, cell: 1 });
    expect(moveArrow(puzzle, start, "left")).toBe(start);
    const column = { entry: down, cell: 3 };
    expect(moveArrow(puzzle, column, "down")).toEqual({ entry: down, cell: 6 });
    expect(moveArrow(puzzle, column, "down").cell).toBe(6);
    expect(moveArrow(puzzle, { entry: down, cell: 6 }, "down")).toEqual({
      entry: down,
      cell: 6,
    });
    const corner = { entry: across, cell: 2 };
    expect(moveArrow(puzzle, corner, "down")).toBe(corner);
    expect(moveArrow(puzzle, corner, "up")).toBe(corner);
  });
});

describe("walking over a block and speaking the cursor", () => {
  const gap: PlayPuzzle = {
    ...puzzle,
    width: 3,
    height: 1,
    rows: [".#."],
    entries: [
      { ...across, id: "1A", cells: [0], answer: "A" },
      { ...across, id: "2A", cells: [2], answer: "B" },
    ],
  };
  it("lands beyond a block in the same row and column", () => {
    const [left, right] = gap.entries as [PlayEntry, PlayEntry];
    expect(moveArrow(gap, { entry: left, cell: 0 }, "right")).toEqual({
      entry: right,
      cell: 2,
    });
    expect(moveArrow(gap, { entry: right, cell: 2 }, "left")).toEqual({
      entry: left,
      cell: 0,
    });
  });
  it("says the square, the length and the word so far", () => {
    const state = enterAnswer(freshState(puzzle), across, "AB");
    expect(describeCursor(state, { entry: across, cell: 1 })).toBe(
      "Square 2 of 3. A B blank.",
    );
    expect(describeCursor(freshState(puzzle), { entry: down, cell: 0 })).toBe(
      "Square 1 of 3. blank blank blank.",
    );
  });
});
