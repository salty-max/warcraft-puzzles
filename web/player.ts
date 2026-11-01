import {
  freshState,
  restoreState,
  enterAnswer,
  useHint,
  revealAnswer,
  checkAnswers,
  entryPattern,
} from "./model.js";
import type { PlayPuzzle, PlayEntry } from "./model.js";

const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const puzzle = JSON.parse(get("puzzle-data").textContent ?? "null") as PlayPuzzle;
const storageKey = `warcraft-trial:${puzzle.id}:${puzzle.fingerprint}`;
const field = get<HTMLInputElement>("answer");
let state = freshState(puzzle);
let selected = puzzle.entries[0]!;
try {
  state = restoreState(puzzle, JSON.parse(localStorage.getItem(storageKey) ?? "null"));
} catch {
  /* A corrupt or unavailable local save starts a new trial. */
}
const cells = new Map<number, HTMLButtonElement>();
const clueButtons = new Map<string, HTMLButtonElement>();
const grid = get<HTMLTableElement>("grid").tBodies[0]!;
const starts = new Map(puzzle.entries.map((entry) => [entry.cells[0]!, entry.number]));
const membership = (cell: number) =>
  puzzle.entries.filter((entry) => entry.cells.includes(cell));
const label = (entry: PlayEntry) =>
  `${entry.number} ${entry.direction} (${entry.enumeration.join(",")})`;

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    get("storage-warning").hidden = false;
  }
}
function paint() {
  for (const [cell, button] of cells) {
    const letter = state.letters[cell]!;
    button.querySelector(".letter")!.textContent = letter;
    button.classList.toggle("active", selected.cells.includes(cell));
    button.setAttribute(
      "aria-label",
      `Row ${Math.floor(cell / puzzle.width) + 1}, column ${(cell % puzzle.width) + 1}, ${letter || "empty"}. ${membership(cell).map(label).join(" and ")}`,
    );
    button.tabIndex = cell === selected.cells[0] ? 0 : -1;
  }
  for (const [id, button] of clueButtons)
    button.setAttribute("aria-pressed", String(id === selected.id));
  get("active-label").textContent = label(selected);
  get("active-clue").textContent = selected.clue;
  get("pattern").textContent = entryPattern(selected, state);
  field.setAttribute("aria-label", `Your answer for ${label(selected)}`);
  const hinted = state.hinted.includes(selected.id);
  get("hint-text").hidden = !hinted;
  get("hint-text").textContent = selected.hint;
  const filled = state.letters.filter(Boolean).length;
  get("progress").textContent = `${filled} / ${cells.size} letters entered`;
  const { solved } = checkAnswers(puzzle, state);
  get("complete").hidden = !solved;
  get("completion-summary").textContent =
    state.hinted.length + state.revealed.length + state.checks === 0
      ? "No hints, reveals or checks."
      : `You used ${state.hinted.length} hint${state.hinted.length === 1 ? "" : "s"}, ${state.revealed.length} reveal${state.revealed.length === 1 ? "" : "s"} and ${state.checks} check${state.checks === 1 ? "" : "s"}.`;
}
function choose(entry: PlayEntry, focus = true) {
  selected = entry;
  field.value = "";
  get("feedback").textContent = "";
  paint();
  if (focus) field.focus();
}
function move(offset: number) {
  choose(
    puzzle.entries[
      (puzzle.entries.indexOf(selected) + offset + puzzle.entries.length) %
        puzzle.entries.length
    ]!,
  );
}
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
      const number = document.createElement("small");
      number.textContent = starts.has(cell) ? String(starts.get(cell)) : "";
      number.setAttribute("aria-hidden", "true");
      const letter = document.createElement("span");
      letter.className = "letter";
      letter.setAttribute("aria-hidden", "true");
      button.append(number, letter);
      button.addEventListener("click", () => {
        const choices = membership(cell);
        choose(choices.find((entry) => entry.id !== selected.id) ?? choices[0]!);
      });
      button.addEventListener("keydown", (event) => {
        const step: Record<string, number> = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -puzzle.width,
          ArrowDown: puzzle.width,
        };
        const delta = step[event.key];
        if (!delta) return;
        event.preventDefault();
        let next = cell + delta;
        while (next >= 0 && next < puzzle.width * puzzle.height) {
          if (Math.abs(delta) === 1 && Math.floor(next / puzzle.width) !== row) break;
          const target = cells.get(next);
          if (target) {
            choose(membership(next)[0]!, false);
            target.focus();
            break;
          }
          next += delta;
        }
      });
      cells.set(cell, button);
      td.append(button);
    }
    tr.append(td);
  }
  grid.append(tr);
}
for (const entry of puzzle.entries) {
  const li = document.createElement("li");
  const button = document.createElement("button");
  const number = document.createElement("span");
  number.className = "number";
  number.textContent = String(entry.number);
  const text = document.createElement("span");
  text.textContent = `${entry.clue} (${entry.enumeration.join(",")})`;
  button.append(number, text);
  button.dataset.slot = entry.id;
  button.addEventListener("click", () => {
    choose(entry);
  });
  clueButtons.set(entry.id, button);
  li.append(button);
  get(entry.direction).append(li);
}
field.addEventListener("input", () => {
  state = enterAnswer(state, selected, field.value);
  get("feedback").textContent = "";
  persist();
  paint();
});
get("answer-form").addEventListener("submit", (event) => {
  event.preventDefault();
  move(1);
});
get("previous").addEventListener("click", () => {
  move(-1);
});
get("next").addEventListener("click", () => {
  move(1);
});
get("hint").addEventListener("click", () => {
  state = useHint(state, selected.id);
  persist();
  paint();
});
get("reveal").addEventListener("click", () => {
  state = revealAnswer(state, selected);
  field.value = selected.answer;
  persist();
  paint();
  get("feedback").textContent = "Answer revealed.";
});
get("check").addEventListener("click", () => {
  state = { ...state, checks: state.checks + 1 };
  persist();
  paint();
  const { correct, solved } = checkAnswers(puzzle, state);
  get("feedback").textContent = solved
    ? "All twelve answers are correct."
    : `${correct} of ${puzzle.entries.length} answers correct.`;
});
const dialog = get<HTMLDialogElement>("reset-dialog");
get("reset").addEventListener("click", () => {
  dialog.showModal();
});
dialog.addEventListener("close", () => {
  if (dialog.returnValue === "reset") {
    state = freshState(puzzle);
    persist();
    choose(puzzle.entries[0]!);
  }
});
paint();
