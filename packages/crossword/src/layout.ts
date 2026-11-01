import { z } from "zod";

export const LayoutSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  rows: z
    .array(z.string().regex(/^[.#]{3,25}$/))
    .min(3)
    .max(25),
});
export type Layout = z.infer<typeof LayoutSchema>;
export type GridIssue = { code: string; message: string };
export type Crossing = { other: number; offset: number; otherOffset: number };
export type Slot = {
  id: string;
  number: number;
  direction: "across" | "down";
  row: number;
  column: number;
  length: number;
  cells: number[];
  crossings: Crossing[];
};
export type Grid = {
  layout: Layout;
  width: number;
  height: number;
  whiteCells: number[];
  slots: Slot[];
};

export class InvalidLayoutError extends Error {
  readonly issues: GridIssue[];
  constructor(issues: GridIssue[]) {
    super(issues.map((issue) => issue.message).join("; "));
    this.name = "InvalidLayoutError";
    this.issues = issues;
  }
}

/** Compile maximal runs, sharing a number at cells that start both directions. */
export function compileLayout(input: unknown): Grid {
  const layout = LayoutSchema.parse(input);
  const height = layout.rows.length;
  const width = layout.rows[0]!.length;
  if (layout.rows.some((row) => row.length !== width)) {
    throw new InvalidLayoutError([
      { code: "rectangle", message: "Rows must have equal widths" },
    ]);
  }
  const cells = layout.rows.join("");
  const whiteCells = [...cells].flatMap((cell, index) => (cell === "." ? [index] : []));
  if (!whiteCells.length) {
    throw new InvalidLayoutError([
      { code: "empty", message: "A grid needs white cells" },
    ]);
  }
  const open = (row: number, column: number) =>
    row >= 0 &&
    row < height &&
    column >= 0 &&
    column < width &&
    cells[row * width + column] === ".";
  const reached = new Set<number>([whiteCells[0]!]);
  for (const cell of reached) {
    const row = Math.floor(cell / width);
    const column = cell % width;
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      if (open(row + dr, column + dc)) reached.add((row + dr) * width + column + dc);
    }
  }
  const issues: GridIssue[] = [];
  if (reached.size !== whiteCells.length) {
    issues.push({
      code: "disconnected",
      message: "White cells must form one connected region",
    });
  }
  const slots: Slot[] = [];
  let number = 0;
  for (const cell of whiteCells) {
    const row = Math.floor(cell / width);
    const column = cell % width;
    const across = !open(row, column - 1);
    const down = !open(row - 1, column);
    if (!across && !down) continue;
    number++;
    for (const direction of ["across", "down"] as const) {
      if (!(direction === "across" ? across : down)) continue;
      const run: number[] = [];
      const dr = direction === "down" ? 1 : 0;
      const dc = direction === "across" ? 1 : 0;
      for (let offset = 0; open(row + dr * offset, column + dc * offset); offset++) {
        run.push((row + dr * offset) * width + column + dc * offset);
      }
      if (run.length < 3) {
        issues.push({
          code: "short-run",
          message: `${number}${direction === "across" ? "A" : "D"} has ${run.length} letters; every white cell needs both runs of at least three`,
        });
      }
      slots.push({
        id: `${number}${direction === "across" ? "A" : "D"}`,
        number,
        direction,
        row,
        column,
        length: run.length,
        cells: run,
        crossings: [],
      });
    }
  }
  if (issues.length) throw new InvalidLayoutError(issues);
  const memberships = new Map<number, { slot: number; offset: number }[]>();
  slots.forEach((slot, slotIndex) =>
    slot.cells.forEach((cell, offset) => {
      const members = memberships.get(cell) ?? [];
      members.push({ slot: slotIndex, offset });
      memberships.set(cell, members);
    }),
  );
  for (const members of memberships.values()) {
    const [a, b] = members as [
      { slot: number; offset: number },
      { slot: number; offset: number },
    ];
    slots[a.slot]!.crossings.push({
      other: b.slot,
      offset: a.offset,
      otherOffset: b.offset,
    });
    slots[b.slot]!.crossings.push({
      other: a.slot,
      offset: b.offset,
      otherOffset: a.offset,
    });
  }
  return { layout, width, height, whiteCells, slots };
}
