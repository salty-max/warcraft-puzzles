import { z } from "zod";

export const CandidateSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  grid: z.string().regex(/^[A-Z]{3,30}$/),
});
export const PlacementSchema = z.strictObject({
  slotId: z.string(),
  entryId: z.string(),
});
export type Candidate = z.infer<typeof CandidateSchema>;
export type Placement = z.infer<typeof PlacementSchema>;

export function parseCandidates(input: unknown): Candidate[] {
  const candidates = z.array(CandidateSchema).max(10000).parse(input);
  const ids = new Set<string>();
  for (const candidate of candidates) {
    if (ids.has(candidate.id))
      throw new Error(`Duplicate candidate ID: ${candidate.id}`);
    ids.add(candidate.id);
  }
  return candidates;
}

/** Alternative clues do not create additional words for the all-different rule. */
export function distinctCandidates(input: unknown): Candidate[] {
  const byWord = new Map<string, Candidate>();
  for (const candidate of parseCandidates(input).sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  )) {
    if (!byWord.has(candidate.grid)) byWord.set(candidate.grid, candidate);
  }
  return [...byWord.values()].sort((a, b) =>
    a.grid < b.grid ? -1 : a.grid > b.grid ? 1 : 0,
  );
}
