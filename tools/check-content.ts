import {
  normalizeAnswer,
  validateCatalogue,
  validateResearch,
} from "../packages/content/src/index.ts";
import { loadCatalogue, loadResearch, loadResearchSnapshot } from "./io.ts";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    publication: { type: "boolean", default: false },
    catalogue: { type: "string" },
    evidence: { type: "string" },
    notes: { type: "boolean", default: false },
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

// Research batches: the dossiers and the triads written from them.
const live = editorial.entries
  .filter((entry) => entry.status !== "rejected")
  .map((entry) => ({ id: entry.id, display: entry.answer.display }));
const researchSnapshot = loadResearchSnapshot();
let researchIssues = 0;
let triads = 0;
let named = 0;
for (const research of loadResearch()) {
  const result = validateResearch(research, researchSnapshot, live);
  triads += research.triads.length;
  researchIssues += result.issues.length;
  named += result.notes.length;
  for (const issue of result.issues)
    console.error(`${research.batch}/${issue.id}: ${issue.code}: ${issue.message}`);
  if (values.notes)
    for (const note of result.notes)
      console.log(`${research.batch}/${note.id}: ${note.code}: ${note.message}`);
}

const batches = new Map(
  loadResearch().map((research) => [
    research.batch,
    new Set(research.dossiers.map((dossier) => normalizeAnswer(dossier.answer))),
  ]),
);
for (const entry of editorial.entries) {
  if (!entry.dossier) continue;
  const [batch, grid] = entry.dossier.split("#") as [string, string];
  if (!batches.get(batch)?.has(grid) || grid !== entry.answer.grid) {
    researchIssues++;
    console.error(`${entry.id}: missing-dossier: no dossier ${entry.dossier} for it`);
  }
}

if (issues.length || researchIssues) process.exitCode = 1;
else
  console.log(
    `Validated ${editorial.entries.length} answer/clue/hint triads (${publication ? "publication" : "research"} mode) and ${triads} research triads${named ? `, ${named} naming another banked answer (--notes lists them)` : ""}.`,
  );
