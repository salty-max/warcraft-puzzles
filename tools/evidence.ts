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

export type ReadOnlyDatabase = {
  prepare(sql: string): { get(...args: (string | number)[]): unknown };
};

/** One parameterised query per citable table, shared by the seed and the research. */
export function readSourceRow(database: ReadOnlyDatabase, locator: Locator) {
  const row =
    locator.table === "readable_page"
      ? database
          .prepare(
            "SELECT * FROM readable_page WHERE kind = ? AND id = ? AND locale = ? AND idx = ?",
          )
          .get(locator.kind, locator.id, locator.locale, locator.idx)
      : locator.table === "quest_text"
        ? database
            .prepare(
              "SELECT * FROM quest_text WHERE quest_id = ? AND locale = ? AND field = ?",
            )
            .get(locator.quest_id, locator.locale, locator.field)
        : database
            .prepare("SELECT * FROM name WHERE kind = ? AND id = ? AND locale = ?")
            .get(locator.kind, locator.id, locator.locale);
  return row as Record<string, unknown> | undefined;
}

/** The answer's game name by id, in English. */
export function readEntityName(
  database: ReadOnlyDatabase,
  kind: string,
  id: number,
): string | undefined {
  const row = database
    .prepare("SELECT name FROM name WHERE kind = ? AND id = ? AND locale = 'enUS'")
    .get(kind, id) as { name?: unknown } | undefined;
  return typeof row?.name === "string" ? row.name : undefined;
}
