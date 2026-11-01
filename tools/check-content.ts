import { validateCatalogue } from "../packages/content/src/index.ts";
import { loadCatalogue } from "./io.ts";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    publication: { type: "boolean", default: false },
    catalogue: { type: "string" },
    evidence: { type: "string" },
  },
});
const { editorial, snapshot } = loadCatalogue(values.catalogue, values.evidence);
const publication = values.publication;
const issues = validateCatalogue(
  editorial,
  snapshot,
  publication ? "publication" : "research",
);
for (const issue of issues)
  console.error(`${issue.entryId}: ${issue.code}: ${issue.message}`);
if (issues.length) process.exitCode = 1;
else
  console.log(
    `Validated ${editorial.entries.length} answer/clue/hint triads (${publication ? "publication" : "research"} mode).`,
  );
