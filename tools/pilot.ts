import { z } from "zod";
import { IdentifierSchema } from "../packages/content/src/schema.ts";
import { prepareResearchPuzzle } from "./research-puzzle.ts";

export const PilotSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    trials: z
      .array(
        z.strictObject({
          id: IdentifierSchema,
          label: z.enum(["Easy", "Medium", "Hard"]),
          portable: IdentifierSchema.refine(
            (value) =>
              !["index", "pilot", "style", "player", "model"].includes(value) &&
              !value.endsWith("-index"),
            "Reserved artifact name",
          ),
          report: IdentifierSchema.refine(
            (value) => value !== "pilot-report",
            "Reserved summary report",
          ),
          notes: z.array(z.string().min(1).max(1500)).min(1).max(5),
        }),
      )
      .length(7),
  })
  .refine(
    (pilot) =>
      ["id", "portable", "report"].every(
        (key) =>
          new Set(
            pilot.trials.map((trial) => trial[key as "id" | "portable" | "report"]),
          ).size === pilot.trials.length,
      ),
    "Pilot identities and output names must be unique",
  )
  .refine(
    (pilot) =>
      pilot.trials.filter((t) => t.label === "Easy").length === 2 &&
      pilot.trials.filter((t) => t.label === "Medium").length === 3 &&
      pilot.trials.filter((t) => t.label === "Hard").length === 2,
    "Pilot needs two Easy, three Medium and two Hard candidates",
  );
export type Trial = z.infer<typeof PilotSchema>["trials"][number];
export const trialRoute = (trial: Trial) =>
  trial.portable === "playtest" ? "/" : `/${trial.portable}`;
export const trialAsset = (trial: Trial) =>
  trial.portable === "playtest" ? "index.html" : `${trial.portable}-index.html`;

/** Data validation and editorial measurements, without granting cold approvals. */
export function preparePilot(
  raw: unknown,
  load: (id: string) => unknown,
  catalogue: unknown,
  evidence: unknown,
) {
  const pilot = PilotSchema.parse(raw);
  const trials = pilot.trials.map((trial) => {
    const prepared = prepareResearchPuzzle(load(trial.id), catalogue, evidence);
    if (prepared.puzzle.id !== trial.id)
      throw new Error(`Pilot identity mismatch: ${trial.id}`);
    return { ...trial, ...prepared };
  });
  const occurrences = new Map<string, number[]>();
  trials.forEach((trial, index) =>
    trial.playable.entries.forEach((entry) => {
      const used = occurrences.get(entry.answer) ?? [];
      used.push(index + 1);
      occurrences.set(entry.answer, used);
    }),
  );
  return {
    trials,
    occurrences,
    totalEntries: [...occurrences.values()].reduce(
      (sum, editions) => sum + editions.length,
      0,
    ),
  };
}
