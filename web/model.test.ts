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
} from "./model.ts";
import type { PlayPuzzle } from "./model.ts";
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
