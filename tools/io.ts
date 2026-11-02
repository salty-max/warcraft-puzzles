import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  EditorialSchema,
  ResearchSchema,
  ResearchSnapshotSchema,
  SnapshotSchema,
} from "../packages/content/src/index.ts";

export const root = fileURLToPath(new URL("../", import.meta.url));

export function readJson(path: URL | string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

export function loadEditorial(
  path: URL | string = new URL("../content/seed/editorial.json", import.meta.url),
) {
  return EditorialSchema.parse(readJson(path));
}

export function loadCatalogue(editorialPath?: string, evidencePath?: string) {
  return {
    editorial: loadEditorial(editorialPath),
    snapshot: SnapshotSchema.parse(
      readJson(
        evidencePath ?? new URL("../content/seed/evidence.json", import.meta.url),
      ),
    ),
  };
}

export const researchDir = new URL("../content/research/", import.meta.url);
export const researchSnapshotPath = new URL(
  "../content/seed/research-evidence.json",
  import.meta.url,
);

/** Every research batch, `content/research/<batch>.json`. */
export function loadResearch(dir: URL = researchDir) {
  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .sort();
  } catch {
    return [];
  }
  return files.map((file) => ResearchSchema.parse(readJson(new URL(file, dir))));
}

export function loadResearchSnapshot(path: URL | string = researchSnapshotPath) {
  try {
    return ResearchSnapshotSchema.parse(readJson(path));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
