import { prepareResearchPuzzle } from "./research-puzzle.ts";

/** The prototype's puzzles are the `play-N.json` files, however many, in numeric order. */
export const playIds = (files: string[]): string[] =>
  files
    .map((file) => /^play-(\d+)\.json$/.exec(file))
    .filter((match): match is RegExpExecArray => match !== null)
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((match) => `play-${match[1]}`);

/** Each play file through the engine's own validator, whatever their count. */
export function preparePlayset(
  ids: string[],
  load: (id: string) => unknown,
  catalogue: unknown,
  evidence: unknown,
) {
  return ids.map((id) => {
    const prepared = prepareResearchPuzzle(load(id), catalogue, evidence);
    if (prepared.puzzle.id !== id) throw new Error(`Playset identity mismatch: ${id}`);
    return { id, number: Number(id.slice(5)), route: `/${id}`, ...prepared };
  });
}
