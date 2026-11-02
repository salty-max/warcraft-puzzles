export type TwinInput = {
  grid: string;
  /** Every prompt the player reads for the answer: clue, hint, fact. */
  text: string[];
  /** The source rows the answer is cited from. */
  rows: string[];
};

/** Shortest answer whose prefix or suffix counts as a twin (NOVA in FROSTNOVA). */
export const MIN_TWIN_LENGTH = 3;

/**
 * Answers that must not share a puzzle: one is spelt out in the other's prompts, they
 * are cited from the same row, or one is the head or tail of the other. Keyed by grid
 * word, symmetric, for the fill's `conflicts` option. A mechanical net for the editor's
 * twin groups, which over-excludes a little by design.
 */
export function twinConflicts(entries: TwinInput[]): Record<string, string[]> {
  const grids = new Set(entries.map((entry) => entry.grid));
  const pairs = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (a === b) return;
    for (const [x, y] of [
      [a, b],
      [b, a],
    ] as const)
      pairs.set(x, (pairs.get(x) ?? new Set<string>()).add(y));
  };
  const byRow = new Map<string, Set<string>>();
  for (const entry of entries) {
    const tokens = entry.text.flatMap(
      (text) => text.toUpperCase().match(/[A-Z]+/g) ?? [],
    );
    for (let start = 0; start < tokens.length; start++) {
      let phrase = "";
      for (const token of tokens.slice(start)) {
        phrase += token;
        if (phrase.length > 30) break;
        if (grids.has(phrase)) link(entry.grid, phrase);
      }
    }
    for (const row of entry.rows)
      byRow.set(row, (byRow.get(row) ?? new Set<string>()).add(entry.grid));
  }
  for (const sharing of byRow.values())
    for (const a of sharing) for (const b of sharing) link(a, b);
  for (const a of grids)
    for (const b of grids)
      if (
        a.length >= MIN_TWIN_LENGTH &&
        b.length > a.length &&
        (b.startsWith(a) || b.endsWith(a))
      )
        link(a, b);
  return Object.fromEntries(
    [...pairs].map(([grid, others]) => [grid, [...others].sort()]),
  );
}
