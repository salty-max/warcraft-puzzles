import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { withLegacyEntries } from "./legacy-bank.ts";
import { PilotSchema, preparePilot, trialAsset, trialRoute } from "./pilot.ts";
const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const raw = read("content/puzzles/pilot.json");
const metadata = PilotSchema.parse(raw);
const catalogue = read("content/seed/editorial.json");
const evidence = read("content/seed/evidence.json");
const load = (id: string) => read(`content/puzzles/${id}.json`);
it("validates all seven authored puzzles and measures actual reuse", () => {
  const before = JSON.stringify([raw, catalogue, evidence]);
  const pilot = preparePilot(raw, load, catalogue, evidence);
  expect(pilot.trials).toHaveLength(7);
  // Preserve the already-played Medium solve key as well as the existing Easy regression.
  expect(pilot.trials[1]!.playable.fingerprint).toBe(
    "900cdf93c081f735466fde05aaa9792555bd2c8abed1d04a6590e338952db9f9",
  );
  expect(pilot.totalEntries).toBe(86);
  expect(pilot.occurrences.size).toBe(84);
  expect(
    [...pilot.occurrences.values()].filter((uses) => uses.length > 1),
  ).toHaveLength(2);
  expect(Math.max(...[...pilot.occurrences.values()].map((uses) => uses.length))).toBe(
    2,
  );
  expect(pilot.trials.every((trial) => trial.puzzle.coldSolve === null)).toBe(true);
  expect(new Set(pilot.trials.map((trial) => trial.playable.fingerprint)).size).toBe(7);
  expect(
    new Set(pilot.trials.map((trial) => trial.puzzle.layout.rows.join("\n"))).size,
  ).toBe(7);
  expect(JSON.stringify([raw, catalogue, evidence])).toBe(before);
  expect(trialRoute(metadata.trials[0]!)).toBe("/");
  expect(trialAsset(metadata.trials[0]!)).toBe("index.html");
  expect(trialRoute(metadata.trials[6]!)).toBe("/hard-2");
  expect(trialAsset(metadata.trials[6]!)).toBe("hard-2-index.html");
});
it("rejects duplicate output identities and invalid difficulty mixes", () => {
  for (const key of ["id", "portable", "report"] as const) {
    const changed = structuredClone(metadata);
    changed.trials[1]![key] = changed.trials[0]![key];
    expect(() => PilotSchema.parse(changed)).toThrow("unique");
  }
  const changed = structuredClone(metadata);
  changed.trials[0]!.label = "Hard";
  expect(() => PilotSchema.parse(changed)).toThrow("two Easy");
  expect(() =>
    PilotSchema.parse({ ...metadata, trials: metadata.trials.slice(1) }),
  ).toThrow();
});
it("rejects reserved outputs, traversal and mismatched puzzle identities", () => {
  for (const name of ["pilot", "index", "player", "medium-index", "../other"]) {
    const changed = structuredClone(metadata);
    changed.trials[0]!.portable = name;
    expect(() => PilotSchema.parse(changed)).toThrow();
  }
  const changed = structuredClone(metadata);
  changed.trials[0]!.report = "pilot-report";
  expect(() => PilotSchema.parse(changed)).toThrow("Reserved");
  expect(() =>
    preparePilot(
      raw,
      (id) => ({ ...(load(id) as object), id: "different" }),
      // The renamed puzzle is no longer a legacy one, restore the cuts to reach the identity check.
      withLegacyEntries(catalogue),
      evidence,
    ),
  ).toThrow("identity mismatch");
});
