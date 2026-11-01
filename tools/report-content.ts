import { readFileSync, writeFileSync } from "node:fs";
import { catalogueReport } from "../packages/content/src/index.ts";
import { loadCatalogue } from "./io.ts";
import { format, resolveConfig } from "prettier";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    check: { type: "boolean", default: false },
    output: { type: "string" },
    catalogue: { type: "string" },
    evidence: { type: "string" },
  },
});
const { editorial, snapshot } = loadCatalogue(values.catalogue, values.evidence);
const path = values.output ?? new URL("../docs/seed-report.md", import.meta.url);
const report = await format(catalogueReport(editorial, snapshot), {
  ...(await resolveConfig(typeof path === "string" ? path : fileURLToPath(path))),
  parser: "markdown",
});
if (values.check) {
  if (readFileSync(path, "utf8") !== report) {
    console.error("Seed report is stale. Run pnpm content:report.");
    process.exitCode = 1;
  } else console.log("Seed report matches the catalogue.");
} else {
  writeFileSync(path, report);
  console.log("Updated docs/seed-report.md.");
}
