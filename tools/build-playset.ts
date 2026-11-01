import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { fillPartiallyCheckedGrid } from "../packages/crossword/src/index.ts";
import { loadCatalogue, readJson, root } from "./io.ts";
import { BenchmarkConfigSchema } from "./benchmark.ts";
import { prepareResearchPuzzle } from "./research-puzzle.ts";

/**
 * Builds consecutive research puzzles from the live bank, no answer repeating inside the
 * cooldown window, each checked by the same validator the player loads through. Writes
 * content/puzzles/play-<n>.json and stops at the first day nothing fills. Unapproved.
 */
const { values } = parseArgs({
  options: {
    days: { type: "string", default: "7" },
    cooldown: { type: "string", default: "90" },
    prefix: { type: "string", default: "bank-" },
  },
});
const { editorial, snapshot } = loadCatalogue();
const config = BenchmarkConfigSchema.parse(
  readJson(new URL("../content/benchmarks/layouts.json", import.meta.url)),
);
const layouts = config.layouts.filter((layout) => layout.id.startsWith(values.prefix));
const live = editorial.entries.filter(
  (entry) => entry.status !== "draft" && entry.status !== "rejected",
);
const grids = new Map(live.map((entry) => [entry.id, entry.answer.grid]));
const used: string[][] = [];
for (let day = 1; day <= Number(values.days); day++) {
  const banned = new Set(used.slice(-Number(values.cooldown)).flat());
  const bank = live
    .filter((entry) => !banned.has(entry.answer.grid))
    .map((entry) => ({ id: entry.id, grid: entry.answer.grid }));
  let built: { puzzle: unknown; words: string[] } | null = null;
  for (let attempt = 0; attempt < layouts.length * 40 && !built; attempt++) {
    const layout = layouts[(day + attempt) % layouts.length]!;
    const result = fillPartiallyCheckedGrid(
      { id: layout.id, rows: layout.rows },
      bank,
      { seed: day * 1000 + attempt, nodeLimit: config.nodeLimit },
    );
    if (result.status !== "solved") continue;
    const puzzle = {
      id: `play-${day}`,
      title: `Playset ${day}`,
      status: "research",
      format: "partially-checked",
      coldSolve: null,
      layout: { id: layout.id, rows: layout.rows },
      placements: result.placements,
    };
    try {
      prepareResearchPuzzle(puzzle, editorial, snapshot);
    } catch {
      continue;
    }
    built = { puzzle, words: result.placements.map((p) => grids.get(p.entryId)!) };
  }
  if (!built) {
    console.log(`Day ${day}: nothing fills under a ${values.cooldown}-day cooldown.`);
    break;
  }
  used.push(built.words);
  writeFileSync(
    `${root}content/puzzles/play-${day}.json`,
    JSON.stringify(built.puzzle, null, 2) + "\n",
  );
  console.log(
    `Day ${day}: ${built.words.length} answers on ${(built.puzzle as { layout: { id: string } }).layout.id}.`,
  );
}
