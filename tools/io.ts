import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EditorialSchema, SnapshotSchema } from "../packages/content/src/index.ts";

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
