import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { cpus } from "node:os";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import { loadCatalogue, readJson, root } from "./io.ts";
import { runBenchmark, benchmarkReport } from "./benchmark.ts";
import type { BenchmarkMeasurement } from "./benchmark.ts";

const { values } = parseArgs({
  options: {
    check: { type: "boolean", default: false },
    config: { type: "string" },
    catalogue: { type: "string" },
    evidence: { type: "string" },
    output: { type: "string" },
    artifact: { type: "string" },
  },
});
const { editorial, snapshot } = loadCatalogue(values.catalogue, values.evidence);
const config = readJson(
  values.config ?? new URL("../content/benchmarks/layouts.json", import.meta.url),
);
const started = performance.now();
const measurements: BenchmarkMeasurement[] = [];
const benchmark = runBenchmark(
  editorial,
  snapshot,
  config,
  values.check ? undefined : (sample) => measurements.push(sample),
);
const elapsedMs = performance.now() - started;
const output =
  values.output ?? fileURLToPath(new URL("../docs/fill-benchmark.md", import.meta.url));
const report = await format(benchmarkReport(benchmark, editorial), {
  ...(await resolveConfig(output)),
  parser: "markdown",
});
if (values.check) {
  if (readFileSync(output, "utf8") !== report) {
    console.error("Fill benchmark is stale. Run pnpm benchmark:run.");
    process.exitCode = 1;
  } else console.log("Fill benchmark matches its inputs and algorithm results.");
} else {
  const artifact = values.artifact ?? join(root, ".cache/benchmarks/latest.json");
  mkdirSync(dirname(artifact), { recursive: true });
  writeFileSync(
    artifact,
    JSON.stringify(
      {
        ...benchmark,
        measurement: {
          elapsedMs,
          cases: measurements,
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          cpu: cpus()[0]?.model ?? "unavailable",
          measuredAt: new Date().toISOString(),
        },
      },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(output, report);
  console.log(
    `Benchmarked ${benchmark.cases.length} cases in ${elapsedMs.toFixed(1)} ms. Updated ${output}; measurements: ${artifact}.`,
  );
}
