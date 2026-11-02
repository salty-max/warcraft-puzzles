import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { LEGACY_PUZZLES, withLegacyEntries } from "./legacy-bank.ts";
import { playIds, preparePlayset } from "./prototype-set.ts";
import { prepareResearchPuzzle } from "./research-puzzle.ts";

const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const catalogue = read("content/seed/editorial.json");
const evidence = read("content/seed/evidence.json");
const load = (id: string) => read(`content/puzzles/${id}.json`);

it("finds the play files in numeric order, whatever their count", () => {
  expect(
    playIds(["play-10.json", "play-2.json", "play-1.json", "easy-2.json"]),
  ).toEqual(["play-1", "play-2", "play-10"]);
  expect(playIds([])).toEqual([]);
});

it("prepares every play file on disk through the engine's validator", () => {
  const ids = playIds(readdirSync("content/puzzles"));
  expect(ids.length).toBeGreaterThan(0);
  const before = JSON.stringify([catalogue, evidence]);
  const trials = preparePlayset(ids, load, catalogue, evidence);
  expect(trials.map((trial) => trial.id)).toEqual(ids);
  expect(trials.map((trial) => trial.number)).toEqual(
    ids.map((id) => Number(id.slice(5))),
  );
  expect(trials.every((trial) => trial.playable.entries.length > 0)).toBe(true);
  expect(new Set(trials.map((trial) => trial.playable.fingerprint)).size).toBe(
    trials.length,
  );
  expect(JSON.stringify([catalogue, evidence])).toBe(before);
});

it("rejects a file whose id is not its name", () => {
  expect(() =>
    preparePlayset(
      ["play-1"],
      (id) => ({ ...(load(id) as object), id: "different" }),
      catalogue,
      evidence,
    ),
  ).toThrow("identity mismatch");
});

it("keeps the legacy research puzzles valid against the old bank", () => {
  for (const id of LEGACY_PUZZLES)
    expect(
      prepareResearchPuzzle(load(id), withLegacyEntries(catalogue, id), evidence)
        .playable.entries.length,
    ).toBeGreaterThan(0);
});
