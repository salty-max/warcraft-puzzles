import { expect, it } from "vitest";
import { fixture } from "../packages/content/test/fixture.ts";
import { bank, mini } from "../packages/crossword/test/fixture.ts";
import { benchmarkReport, runBenchmark } from "./benchmark.ts";
import type { BenchmarkMeasurement } from "./benchmark.ts";
import { loadCatalogue, readJson } from "./io.ts";
import { withLegacyEntries } from "./legacy-bank.ts";
import { EditorialSchema } from "../packages/content/src/index.ts";

const config = { schemaVersion: 1, seeds: [0, 42], nodeLimit: 1000, layouts: [mini] };

function synthetic() {
  const { editorial, snapshot, entry } = fixture();
  editorial.entries = bank.map((word) => ({
    ...structuredClone(entry),
    id: word.id,
    answer: { ...entry.answer, display: word.grid, grid: word.grid, enumeration: [3] },
  }));
  return { editorial, snapshot };
}

// The committed layouts were drawn for the pre-rebuild bank of short common words, so the
// engine regression replays them with the rebuild's cuts restored (the old entries plus
// the new ones). How the rebuilt bank fills them is
// reported honestly in docs/fill-benchmark.md and asserted only to run, below.
it("replays the live and cut entries together on all committed layouts without approving content", () => {
  const loaded = loadCatalogue();
  const editorial = EditorialSchema.parse(withLegacyEntries(loaded.editorial));
  const { snapshot } = loaded;
  const input = readJson(
    new URL("../content/benchmarks/layouts.json", import.meta.url),
  );
  const before = JSON.stringify([editorial, snapshot]);
  const result = runBenchmark(editorial, snapshot, input);
  const measurements: BenchmarkMeasurement[] = [];
  expect(
    runBenchmark(editorial, snapshot, input, (sample) => measurements.push(sample)),
  ).toEqual(result);
  expect(measurements).toHaveLength(result.cases.length);
  expect(
    measurements.every(
      (sample) => Number.isFinite(sample.elapsedMs) && sample.elapsedMs >= 0,
    ),
  ).toBe(true);
  expect(runBenchmark(editorial, snapshot, input)).toEqual(result);
  expect(new Set(result.layouts.map((layout) => layout.width))).toEqual(
    new Set([5, 7, 8, 9, 10, 11, 12, 13]),
  );
  expect(result.cases).toHaveLength(
    result.layouts.length * 2 * result.config.seeds.length,
  );
  expect(result.cohorts[0]!.entries).toBeGreaterThan(0);
  expect(benchmarkReport(result, editorial)).toContain("unpublished");
  expect(
    result.cases
      .filter((run) => run.checking === "partial" && run.cohort === "all-triads")
      .every((run) => run.result.status === "solved"),
  ).toBe(true);
  expect(result.layouts.filter((layout) => layout.checking === "partial")).toHaveLength(
    14,
  );
  expect(
    result.cases
      .filter((run) => run.checking === "full" && run.cohort === "all-triads")
      .every((run) => run.result.status === "unsatisfiable"),
  ).toBe(true);
  expect(benchmarkReport(result, editorial)).toContain("Partially checked (primary)");
  expect(JSON.stringify([editorial, snapshot])).toBe(before);
  // The rebuilt bank alone, no restored cuts, fills the layouts drawn for it.
  const live = runBenchmark(loaded.editorial, snapshot, input, undefined, {
    twins: true,
  });
  const own = live.cases.filter(
    (run) => run.layoutId.startsWith("bank-") && run.cohort === "all-triads",
  );
  expect(own.length).toBeGreaterThan(0);
  expect(own.every((run) => run.result.status === "solved")).toBe(true);
});

it("exports independently validated success examples with original triad metadata", () => {
  const { editorial, snapshot } = synthetic();
  editorial.entries[0]!.clue.text = "Synthetic | clue\non two lines";
  const result = runBenchmark(editorial, snapshot, config);
  expect(result.cases.filter((run) => run.result.status === "solved")).toHaveLength(2);
  const report = benchmarkReport(result, editorial);
  expect(report).toContain("Complete fill");
  expect(report).toContain("Synthetic \\| clue on two lines");
  expect(report).toContain("```text");
  expect(report).toContain("| ABC | 3 |");
});

it("excludes draft/rejected entries and hashes substantive input changes", () => {
  const { editorial, snapshot } = synthetic();
  const before = runBenchmark(editorial, snapshot, config);
  editorial.entries[0]!.status = "draft";
  editorial.entries[1]!.status = "rejected";
  const after = runBenchmark(editorial, snapshot, config);
  expect(after.cohorts[0]!.entries).toBe(4);
  expect(after.inputSha256).not.toBe(before.inputSha256);
  expect(after.cases.every((run) => run.result.status === "unsatisfiable")).toBe(true);
});

it("keeps budget-limited cases distinct in the report", () => {
  const { editorial, snapshot, entry } = fixture();
  editorial.entries = ["AAA", "AAB", "ABA", "ABB", "BAA", "BAB", "BBA", "BBB"].map(
    (word, i) => ({
      ...structuredClone(entry),
      id: `word-${i}`,
      answer: { ...entry.answer, display: word, grid: word, enumeration: [3] },
    }),
  );
  const result = runBenchmark(editorial, snapshot, { ...config, nodeLimit: 1 });
  expect(result.cases[0]!.result.status).toBe("budget-exhausted");
  expect(benchmarkReport(result, editorial)).toContain("node budget");
});

it("rejects invalid research content and ambiguous benchmark configuration", () => {
  const { editorial, snapshot } = synthetic();
  for (const input of [
    { ...config, seeds: [0, 0] },
    { ...config, layouts: [mini, mini] },
    { ...config, nodeLimit: 0 },
    { ...config, layouts: [{ ...mini, checking: "semi" }] },
    { ...config, layouts: [{ ...mini, rows: ["###", "###", "###"] }] },
  ]) {
    expect(() => runBenchmark(editorial, snapshot, input)).toThrow();
  }
  snapshot.evidence[0]!.excerpt = "Changed";
  expect(() => runBenchmark(editorial, snapshot, config)).toThrow(
    "Invalid research catalogue",
  );
});

it("replays the rebuilt seed on the committed layouts deterministically", () => {
  const { editorial, snapshot } = loadCatalogue();
  const input = readJson(
    new URL("../content/benchmarks/layouts.json", import.meta.url),
  );
  const result = runBenchmark(editorial, snapshot, input);
  expect(runBenchmark(editorial, snapshot, input)).toEqual(result);
  expect(result.cohorts[0]!.entries).toBeGreaterThan(300);
});
