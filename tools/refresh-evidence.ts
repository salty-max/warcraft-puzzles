import { createHash } from "node:crypto";
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { parseArgs } from "node:util";
import { SnapshotSchema } from "../packages/content/src/index.ts";
import { verifyCitation } from "./evidence.ts";
import type { SourceRow } from "./evidence.ts";
import { loadEditorial } from "./io.ts";

const { values } = parseArgs({
  options: {
    database: { type: "string" },
    check: { type: "boolean", default: false },
    catalogue: { type: "string" },
    output: { type: "string" },
  },
});
if (!values.database)
  throw new Error("Pass --database /absolute/path/to/classic.db (read-only input).");

const hash = createHash("sha256");
for await (const chunk of createReadStream(values.database))
  hash.update(chunk as Buffer);
const database = new DatabaseSync(values.database, { readOnly: true });
try {
  const game = database.prepare("SELECT value FROM meta WHERE key = 'game'").get();
  if (game?.value !== "classic")
    throw new Error("This seed requires the Classic research database.");
  const editorial = loadEditorial(values.catalogue);
  const evidence = editorial.citations.map((citation) =>
    verifyCitation(citation, (locator) => {
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
      if (!row) return undefined;
      if (typeof row.source !== "string") {
        throw new Error(`${citation.id}: invalid source row`);
      }
      return row as SourceRow;
    }),
  );
  const sources = [...new Set(evidence.map((item) => item.sourceId))]
    .sort()
    .map((id) => {
      const row = database
        .prepare("SELECT version, url, license FROM source WHERE name = ?")
        .get(id);
      if (!row) throw new Error(`Missing source metadata: ${id}`);
      return { id, ...row };
    });
  const snapshot = SnapshotSchema.parse({
    schemaVersion: 1,
    database: { game: "classic", sha256: hash.digest("hex") },
    sources,
    evidence,
  });
  const path =
    values.output ?? new URL("../content/seed/evidence.json", import.meta.url);
  const output = JSON.stringify(snapshot, null, 2) + "\n";
  if (values.check) {
    if (
      JSON.stringify(SnapshotSchema.parse(JSON.parse(readFileSync(path, "utf8")))) !==
      JSON.stringify(snapshot)
    ) {
      throw new Error(
        "Evidence snapshot differs. Review source changes before refreshing and reapproving entries.",
      );
    }
    console.log(
      `Replayed ${evidence.length} exact citations against the pinned database.`,
    );
  } else {
    writeFileSync(path, output);
    console.log(
      `Refreshed ${evidence.length} citations. Changed evidence invalidates earlier review digests.`,
    );
  }
} finally {
  database.close();
}
