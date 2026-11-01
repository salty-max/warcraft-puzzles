import type { Citation, Locator } from "../packages/content/src/index.ts";
import { sha256 } from "../packages/content/src/index.ts";

export type SourceRow = { source: string } & Record<string, unknown>;
export type EvidenceReader = (locator: Locator) => SourceRow | undefined;

export function canonicalRow(row: Record<string, unknown>): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))),
  );
}

export function verifyCitation(citation: Citation, read: EvidenceReader) {
  const row = read(citation.locator);
  if (!row) throw new Error(`${citation.id}: source row does not exist`);
  if (!["classicdb", "client", "questie", "wowhead"].includes(row.source)) {
    throw new Error(`${citation.id}: source ${row.source} is not permitted`);
  }
  const sourceText = citation.locator.table === "name" ? row.name : row.text;
  if (typeof sourceText !== "string") {
    throw new Error(`${citation.id}: expected a string in the source field`);
  }
  if (!sourceText.includes(citation.excerpt)) {
    throw new Error(`${citation.id}: excerpt is not an exact substring of its source`);
  }
  return {
    ...citation,
    sourceId: row.source,
    rowSha256: sha256(canonicalRow(row)),
    excerptSha256: sha256(citation.excerpt),
  };
}
