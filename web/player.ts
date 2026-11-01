import {
  freshState,
  restoreState,
  useHint,
  revealAnswer,
  checkAnswers,
  wrongCells,
  entryAt,
  startCursor,
  typeLetter,
  backspace,
  toggleDirection,
  moveArrow,
  describeCursor,
} from "./model.js";
import type { PlayPuzzle, PlayEntry, Cursor, Arrow } from "./model.js";

const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const puzzle = JSON.parse(get("puzzle-data").textContent ?? "null") as PlayPuzzle;
const storageKey = `warcraft-trial:${puzzle.id}:${puzzle.fingerprint}`;
const keys = get<HTMLInputElement>("keys");
let state = freshState(puzzle);
try {
  state = restoreState(puzzle, JSON.parse(localStorage.getItem(storageKey) ?? "null"));
} catch {
  /* A corrupt or unavailable local save starts a new trial. */
}
let cursor: Cursor = startCursor(state, puzzle.entries[0]!);
let marked = new Set<number>();
let shown: string[] = [];
const cells = new Map<number, HTMLButtonElement>();
const clueButtons = new Map<string, HTMLButtonElement>();
const grid = get<HTMLTableElement>("grid");
const starts = new Map(puzzle.entries.map((entry) => [entry.cells[0]!, entry.number]));
const membership = (cell: number) =>
  puzzle.entries.filter((entry) => entry.cells.includes(cell));
const label = (entry: PlayEntry) =>
  `${entry.number} ${entry.direction} (${entry.enumeration.join(",")})`;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const setText = (id: string, text: string) => {
  const element = get(id);
  if (element.textContent !== text) element.textContent = text;
};

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    get("storage-warning").hidden = false;
  }
}
function keepInView(button: HTMLElement) {
  const panel = button.closest<HTMLElement>(".clue-panel");
  if (!panel || panel.scrollHeight <= panel.clientHeight) return;
  const inside = button.getBoundingClientRect().top - panel.getBoundingClientRect().top;
  const wanted = panel.clientHeight / 2 - button.offsetHeight / 2;
  panel.scrollTop += inside - wanted;
}
function paint() {
  const active = new Set(cursor.entry.cells);
  const crossing = new Set(
    membership(cursor.cell)
      .filter((entry) => entry.id !== cursor.entry.id)
      .map((entry) => entry.id),
  );
  for (const [cell, button] of cells) {
    const letter = state.letters[cell]!;
    const td = button.parentElement!;
    td.classList.toggle("in-entry", active.has(cell));
    td.classList.toggle("cursor", cell === cursor.cell);
    td.classList.toggle("wrong", marked.has(cell));
    if (letter && letter !== shown[cell] && !calm) {
      td.classList.remove("pop");
      void td.offsetWidth;
      td.classList.add("pop");
    }
    button.querySelector(".letter")!.textContent = letter;
    button.setAttribute(
      "aria-label",
      `Row ${Math.floor(cell / puzzle.width) + 1}, column ${(cell % puzzle.width) + 1}, ${letter || "empty"}. ${membership(cell).map(label).join(" and ")}`,
    );
  }
  shown = [...state.letters];
  for (const entry of puzzle.entries) {
    const button = clueButtons.get(entry.id)!;
    button.setAttribute("aria-pressed", String(entry.id === cursor.entry.id));
    button.classList.toggle("through", crossing.has(entry.id));
    button.classList.toggle(
      "filled",
      entry.cells.every((cell) => state.letters[cell]),
    );
  }
  keepInView(clueButtons.get(cursor.entry.id)!);
  setText("active-label", label(cursor.entry));
  setText("active-clue", cursor.entry.clue);
  keys.setAttribute(
    "aria-label",
    `Type your answer for ${label(cursor.entry)}. Arrow keys move, space turns, enter goes to the next clue.`,
  );
  setText("hint-text", state.hinted.includes(cursor.entry.id) ? cursor.entry.hint : "");
  setText("where", describeCursor(state, cursor));
  setText(
    "progress",
    `${state.letters.filter(Boolean).length} / ${cells.size} letters entered`,
  );
  const { solved } = checkAnswers(puzzle, state);
  get("complete").hidden = !solved;
  setText(
    "completion-summary",
    state.hinted.length + state.revealed.length + state.checks === 0
      ? "No hints, reveals or checks."
      : `You used ${state.hinted.length} hint${state.hinted.length === 1 ? "" : "s"}, ${state.revealed.length} reveal${state.revealed.length === 1 ? "" : "s"} and ${state.checks} check${state.checks === 1 ? "" : "s"}.`,
  );
}
function focusKeys() {
  keys.focus({ preventScroll: true });
}
/** Applies an edit: forgets marks on squares that changed, saves, repaints. */
function edit(next: { state: typeof state; cursor: Cursor }) {
  for (const cell of [...marked])
    if (next.state.letters[cell] !== state.letters[cell]) marked.delete(cell);
  state = next.state;
  cursor = next.cursor;
  setText("feedback", "");
  persist();
  paint();
}
function choose(entry: PlayEntry, focus = true) {
  cursor = startCursor(state, entry);
  setText("feedback", "");
  paint();
  if (focus) focusKeys();
}
function move(offset: number) {
  choose(
    puzzle.entries[
      (puzzle.entries.indexOf(cursor.entry) + offset + puzzle.entries.length) %
        puzzle.entries.length
    ]!,
  );
}
const arrows: Record<string, Arrow> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};
const lettersIn = (text: string) => text.replace(/[^a-z]/gi, "");

for (let row = 0; row < puzzle.height; row++) {
  const tr = document.createElement("tr");
  for (let column = 0; column < puzzle.width; column++) {
    const td = document.createElement("td");
    const cell = row * puzzle.width + column;
    if (puzzle.rows[row]![column] === "#") {
      td.className = "block";
      td.setAttribute("aria-hidden", "true");
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.tabIndex = -1;
      button.dataset.cell = String(cell);
      const number = document.createElement("small");
      number.textContent = starts.has(cell) ? String(starts.get(cell)) : "";
      number.setAttribute("aria-hidden", "true");
      const letter = document.createElement("span");
      letter.className = "letter";
      letter.setAttribute("aria-hidden", "true");
      button.append(number, letter);
      button.addEventListener("click", () => {
        cursor =
          cell === cursor.cell
            ? toggleDirection(puzzle, cursor)
            : { cell, entry: entryAt(puzzle, cell, cursor.entry.direction)! };
        setText("feedback", "");
        paint();
        focusKeys();
      });
      td.addEventListener("animationend", () => td.classList.remove("pop"));
      cells.set(cell, button);
      td.append(button);
    }
    tr.append(td);
  }
  grid.tBodies[0]!.append(tr);
}
grid.style.setProperty("--cols", String(puzzle.width));
grid.style.setProperty("--rows", String(puzzle.height));
for (const entry of puzzle.entries) {
  const li = document.createElement("li");
  const button = document.createElement("button");
  const number = document.createElement("span");
  number.className = "number";
  number.textContent = String(entry.number);
  const text = document.createElement("span");
  text.className = "text";
  text.textContent = `${entry.clue} (${entry.enumeration.join(",")})`;
  button.append(number, text);
  button.dataset.slot = entry.id;
  button.addEventListener("click", () => {
    choose(entry);
    get("clue-bar").scrollIntoView({
      block: "nearest",
      behavior: calm ? "auto" : "smooth",
    });
  });
  clueButtons.set(entry.id, button);
  li.append(button);
  get(entry.direction).append(li);
}

keys.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  /* An input method's own keys (a commit, a letter it reports twice) are left to it. */
  if (event.isComposing || event.keyCode === 229) return;
  const arrow = arrows[event.key];
  if (arrow) {
    cursor = moveArrow(puzzle, cursor, arrow);
    setText("feedback", "");
    paint();
  } else if (event.key === "Backspace") edit(backspace(state, cursor));
  else if (event.key === "Delete") {
    const letters = [...state.letters];
    letters[cursor.cell] = "";
    edit({ state: { ...state, letters }, cursor });
  } else if (event.key === " ") {
    cursor = toggleDirection(puzzle, cursor);
    paint();
  } else if (event.key === "Home" || event.key === "End") {
    const { cells: along } = cursor.entry;
    cursor = {
      ...cursor,
      cell: event.key === "Home" ? along[0]! : along[along.length - 1]!,
    };
    paint();
  } else if (event.key === "Enter") move(event.shiftKey ? -1 : 1);
  else if (/^[a-z]$/i.test(event.key)) edit(typeLetter(state, cursor, event.key));
  else return;
  event.preventDefault();
});
/* Phone keyboards often send no useful key: a delete or a run of letters arrives as input.
   An input method may also compose in the field, resending its whole buffer on each key,
   so while composing only what was added since the last event counts. */
let composing = "";
keys.addEventListener("beforeinput", (event) => {
  if (event.isComposing || event.inputType !== "deleteContentBackward") return;
  event.preventDefault();
  edit(backspace(state, cursor));
});
keys.addEventListener("input", (event) => {
  const now = lettersIn(keys.value);
  if (event.isComposing) {
    let next = { state, cursor };
    if (now.startsWith(composing))
      for (const letter of now.slice(composing.length))
        next = typeLetter(next.state, next.cursor, letter);
    else if (composing.startsWith(now))
      for (let i = now.length; i < composing.length; i++)
        next = backspace(next.state, next.cursor);
    composing = now;
    edit(next);
    return;
  }
  /* Browsers differ on whether a last input follows the end of a composition: skip what the
     composition already applied. */
  const applied = !composing
    ? 0
    : now.startsWith(composing)
      ? composing.length
      : now.length;
  composing = "";
  if (!now && keys.value.includes(" ")) {
    /* Some phone keyboards send the space bar as input, not as a key. */
    cursor = toggleDirection(puzzle, cursor);
    paint();
  } else {
    let next = { state, cursor };
    for (const letter of now.slice(applied))
      next = typeLetter(next.state, next.cursor, letter);
    edit(next);
  }
  keys.value = "";
});
keys.addEventListener("compositionend", () => {
  /* Firefox sends its last input after this event, Chrome before it: wait, then tidy up. */
  setTimeout(() => {
    composing = "";
    keys.value = "";
  }, 0);
});
/* A button taken while typing keeps the cursor and the keyboard, one taken otherwise does not. */
let wasTyping = false;
const typing = () => {
  const had = wasTyping;
  wasTyping = false;
  return had;
};
const actions = document.querySelector(".actions")!;
actions.addEventListener(
  "pointerdown",
  () => {
    wasTyping = document.activeElement === keys;
  },
  true,
);
/* After the button's own handler has looked, so no button leaves a stale answer behind. */
actions.addEventListener("click", () => {
  wasTyping = false;
});
get("previous").addEventListener("click", () => {
  move(-1);
});
get("next").addEventListener("click", () => {
  move(1);
});
get("hint").addEventListener("click", () => {
  state = useHint(state, cursor.entry.id);
  persist();
  paint();
  if (typing()) focusKeys();
});
get("reveal").addEventListener("click", () => {
  edit({ state: revealAnswer(state, cursor.entry), cursor });
  setText("feedback", "Answer revealed.");
  if (typing()) focusKeys();
});
get("check").addEventListener("click", () => {
  state = { ...state, checks: state.checks + 1 };
  marked = new Set(wrongCells(puzzle, state));
  persist();
  const { correct, solved } = checkAnswers(puzzle, state);
  const wrong = marked.size;
  setText(
    "feedback",
    solved
      ? "All answers are correct."
      : `${correct} of ${puzzle.entries.length} answers correct.${wrong ? ` ${wrong} wrong square${wrong === 1 ? " is" : "s are"} marked.` : ""}`,
  );
  paint();
});
const dialog = get<HTMLDialogElement>("reset-dialog");
get("reset").addEventListener("click", () => {
  dialog.showModal();
});
dialog.addEventListener("close", () => {
  if (dialog.returnValue === "reset") {
    state = freshState(puzzle);
    marked = new Set();
    persist();
    choose(puzzle.entries[0]!);
  }
});
paint();
