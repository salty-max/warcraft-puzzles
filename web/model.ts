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

export type Cursor = { cell: number; entry: PlayEntry };
export type Arrow = "left" | "right" | "up" | "down";

const isBlock = (puzzle: PlayPuzzle, cell: number) =>
  puzzle.rows[Math.floor(cell / puzzle.width)]![cell % puzzle.width] === "#";

/** The letter each square should hold, empty for a block. */
export function solutionLetters(puzzle: PlayPuzzle): string[] {
  const letters = Array<string>(puzzle.width * puzzle.height).fill("");
  for (const entry of puzzle.entries)
    entry.cells.forEach((cell, offset) => {
      letters[cell] = entry.answer[offset]!;
    });
  return letters;
}

/** Squares holding a letter that is not the answer's. */
export function wrongCells(puzzle: PlayPuzzle, state: PlayState): number[] {
  const solution = solutionLetters(puzzle);
  return state.letters.flatMap((letter, cell) =>
    letter && letter !== solution[cell] ? [cell] : [],
  );
}

/** The entry through a square, in the preferred direction when it has one. */
export function entryAt(
  puzzle: PlayPuzzle,
  cell: number,
  prefer: PlayEntry["direction"],
): PlayEntry | undefined {
  const through = puzzle.entries.filter((entry) => entry.cells.includes(cell));
  return through.find((entry) => entry.direction === prefer) ?? through[0];
}

/** Where typing starts in an entry: its first empty square, else its first. */
export function startCursor(state: PlayState, entry: PlayEntry): Cursor {
  return {
    entry,
    cell: entry.cells.find((cell) => !state.letters[cell]) ?? entry.cells[0]!,
  };
}

/** Puts a letter in the current square and moves on, never wiping a crossing. */
export function typeLetter(
  state: PlayState,
  cursor: Cursor,
  letter: string,
): { state: PlayState; cursor: Cursor } {
  const upper = letter.toUpperCase();
  if (!/^[A-Z]$/.test(upper)) return { state, cursor };
  const letters = [...state.letters];
  letters[cursor.cell] = upper;
  const at = cursor.entry.cells.indexOf(cursor.cell);
  const next = cursor.entry.cells[at + 1] ?? cursor.cell;
  return { state: { ...state, letters }, cursor: { ...cursor, cell: next } };
}

/** Clears this square, or the one before it when this one is already empty. */
export function backspace(
  state: PlayState,
  cursor: Cursor,
): { state: PlayState; cursor: Cursor } {
  const at = cursor.entry.cells.indexOf(cursor.cell);
  const target = state.letters[cursor.cell]
    ? cursor.cell
    : (cursor.entry.cells[at - 1] ?? cursor.cell);
  if (!state.letters[target]) return { state, cursor };
  const letters = [...state.letters];
  letters[target] = "";
  return { state: { ...state, letters }, cursor: { ...cursor, cell: target } };
}

/** Switches across and down at a crossing, and does nothing elsewhere. */
export function toggleDirection(puzzle: PlayPuzzle, cursor: Cursor): Cursor {
  const other = puzzle.entries.find(
    (entry) => entry.id !== cursor.entry.id && entry.cells.includes(cursor.cell),
  );
  return other ? { ...cursor, entry: other } : cursor;
}

/** An arrow turns first when the square has an entry that way, then walks over blocks. */
export function moveArrow(puzzle: PlayPuzzle, cursor: Cursor, arrow: Arrow): Cursor {
  const direction = arrow === "left" || arrow === "right" ? "across" : "down";
  if (direction !== cursor.entry.direction) {
    const turned = entryAt(puzzle, cursor.cell, direction);
    if (turned && turned.direction === direction) return { ...cursor, entry: turned };
  }
  const dx = arrow === "left" ? -1 : arrow === "right" ? 1 : 0;
  const dy = arrow === "up" ? -1 : arrow === "down" ? 1 : 0;
  let row = Math.floor(cursor.cell / puzzle.width) + dy;
  let column = (cursor.cell % puzzle.width) + dx;
  while (row >= 0 && row < puzzle.height && column >= 0 && column < puzzle.width) {
    const cell = row * puzzle.width + column;
    if (!isBlock(puzzle, cell))
      return { cell, entry: entryAt(puzzle, cell, direction) ?? cursor.entry };
    row += dy;
    column += dx;
  }
  return cursor;
}

/** Where the cursor is, in words: for a screen reader that hears only the input. */
export function describeCursor(state: PlayState, cursor: Cursor): string {
  const { cells } = cursor.entry;
  const word = cells.map((cell) => state.letters[cell] || "blank").join(" ");
  return `Square ${cells.indexOf(cursor.cell) + 1} of ${cells.length}. ${word}.`;
}
