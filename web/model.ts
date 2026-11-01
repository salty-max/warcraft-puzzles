export type PlayEntry = {
  id: string;
  number: number;
  direction: "across" | "down";
  cells: number[];
  answer: string;
  enumeration: number[];
  clue: string;
  hint: string;
};
export type PlayPuzzle = {
  id: string;
  title: string;
  fingerprint: string;
  width: number;
  height: number;
  rows: string[];
  entries: PlayEntry[];
};
export type PlayState = {
  letters: string[];
  hinted: string[];
  revealed: string[];
  checks: number;
};
export function freshState(puzzle: PlayPuzzle): PlayState {
  return {
    letters: Array<string>(puzzle.width * puzzle.height).fill(""),
    hinted: [],
    revealed: [],
    checks: 0,
  };
}
export function restoreState(puzzle: PlayPuzzle, input: unknown): PlayState {
  const fresh = freshState(puzzle);
  if (typeof input !== "object" || input === null) return fresh;
  const value = input as Record<string, unknown>;
  const ids = new Set(puzzle.entries.map((entry) => entry.id));
  const validIds = (v: unknown): v is string[] =>
    Array.isArray(v) &&
    v.every((id: unknown) => typeof id === "string" && ids.has(id)) &&
    new Set(v).size === v.length;
  if (
    !Array.isArray(value.letters) ||
    value.letters.length !== fresh.letters.length ||
    !value.letters.every(
      (letter: unknown, cell: number) =>
        typeof letter === "string" &&
        /^[A-Z]?$/.test(letter) &&
        (puzzle.rows.join("")[cell] !== "#" || letter === ""),
    ) ||
    !validIds(value.hinted) ||
    !validIds(value.revealed) ||
    typeof value.checks !== "number" ||
    !Number.isSafeInteger(value.checks) ||
    value.checks < 0
  )
    return fresh;
  return {
    letters: [...(value.letters as string[])],
    hinted: [...value.hinted],
    revealed: [...value.revealed],
    checks: value.checks,
  };
}
export function enterAnswer(
  state: PlayState,
  entry: PlayEntry,
  text: string,
): PlayState {
  const letters = [...state.letters];
  const input = text.toUpperCase().replace(/[^A-Z]/g, "");
  entry.cells.forEach((cell, offset) => {
    letters[cell] = input[offset] ?? "";
  });
  return { ...state, letters };
}
export function useHint(state: PlayState, id: string): PlayState {
  return state.hinted.includes(id)
    ? state
    : { ...state, hinted: [...state.hinted, id] };
}
export function revealAnswer(state: PlayState, entry: PlayEntry): PlayState {
  return {
    ...enterAnswer(state, entry, entry.answer),
    revealed: state.revealed.includes(entry.id)
      ? state.revealed
      : [...state.revealed, entry.id],
  };
}
export function checkAnswers(puzzle: PlayPuzzle, state: PlayState) {
  const correct = puzzle.entries.filter((entry) =>
    entry.cells.every((cell, offset) => state.letters[cell] === entry.answer[offset]),
  ).length;
  return { correct, solved: correct === puzzle.entries.length };
}
export function entryPattern(entry: PlayEntry, state: PlayState): string {
  return entry.cells.map((cell) => state.letters[cell] || "·").join("");
}
