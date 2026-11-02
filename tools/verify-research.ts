import { createHash } from "node:crypto";
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { parseArgs } from "node:util";
import {
  entityKey,
  isWebSource,
  normalizeText,
  ResearchSnapshotSchema,
  sha256,
  sourceKey,
} from "../packages/content/src/index.ts";
import type { ResearchSnapshot } from "../packages/content/src/index.ts";
import { canonicalRow, readEntityName, readSourceRow } from "./evidence.ts";
import { loadResearch, researchSnapshotPath } from "./io.ts";
import { fetchRevision, passageInRevision, titleFromUrl } from "./wiki.ts";

// Proves each research batch against the network and wow-data, then records what it
// proved so CI can replay it offline. Run before a batch's commit, and with --check to
// confirm nothing moved.
const { values } = parseArgs({
  options: {
    database: { type: "string" },
    forever: { type: "string" },
    check: { type: "boolean", default: false },
  },
});
if (!values.database || !values.forever) {
  throw new Error("Pass --database classic.db and --forever forever.db (read-only).");
}

async function fingerprint(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

const databases = {
  classic: new DatabaseSync(values.database, { readOnly: true }),
  forever: new DatabaseSync(values.forever, { readOnly: true }),
};
const problems: string[] = [];
// The seed's allow-list: never player-derived rows.
const GAME_SOURCES = ["classicdb", "client", "questie", "wowhead"];
try {
  for (const [game, database] of Object.entries(databases)) {
    const row = database.prepare("SELECT value FROM meta WHERE key = 'game'").get();
    if (row?.value !== game) throw new Error(`Expected the ${game} database`);
  }
  const entities = new Map<string, ResearchSnapshot["entities"][number]>();
  const sources = new Map<string, ResearchSnapshot["sources"][number]>();
  for (const research of loadResearch()) {
    for (const dossier of research.dossiers) {
      const { db, kind, id } = dossier.entity;
      const name = readEntityName(databases[db], kind, id);
      if (!name) {
        problems.push(`${research.batch}/${dossier.answer}: no ${kind} ${id} in ${db}`);
        continue;
      }
      const inClassic = readEntityName(databases.classic, kind, id) === name;
      entities.set(entityKey(dossier.entity), { db, kind, id, name, inClassic });

      for (const fact of dossier.facts) {
        for (const source of fact.sources) {
          const where = `${research.batch}/${dossier.answer}/${fact.id}`;
          if (isWebSource(source)) {
            if (source.manual || !source.revid) continue;
            const revision = await fetchRevision({ revid: source.revid });
            if (revision.title !== titleFromUrl(source.url)) {
              problems.push(`${where}: revision ${source.revid} is ${revision.title}`);
            } else if (!passageInRevision(source.passage, revision.content)) {
              problems.push(`${where}: passage not in revision ${source.revid}`);
            } else {
              sources.set(sourceKey(source), {
                key: sourceKey(source),
                passageSha256: sha256(normalizeText(source.passage)),
                contentSha256: sha256(revision.content),
              });
            }
            continue;
          }
          const row = readSourceRow(databases[source.game.db], source.game.locator);
          const textField =
            source.game.locator.table === "name" ? row?.name : row?.text;
          if (typeof textField !== "string") {
            problems.push(`${where}: no ${source.game.db} row`);
          } else if (!GAME_SOURCES.includes(String(row!.source))) {
            problems.push(`${where}: source ${String(row!.source)} is not permitted`);
          } else if (
            !normalizeText(textField).includes(normalizeText(source.passage))
          ) {
            problems.push(`${where}: passage not in the ${source.game.db} row`);
          } else {
            sources.set(sourceKey(source), {
              key: sourceKey(source),
              passageSha256: sha256(normalizeText(source.passage)),
              contentSha256: sha256(canonicalRow(row!)),
            });
          }
        }
      }
    }
  }
  const snapshot = ResearchSnapshotSchema.parse({
    schemaVersion: 1,
    databases: {
      classic: await fingerprint(values.database),
      forever: await fingerprint(values.forever),
    },
    entities: [...entities.values()].sort((a, b) =>
      entityKey(a).localeCompare(entityKey(b)),
    ),
    sources: [...sources.values()].sort((a, b) => a.key.localeCompare(b.key)),
  });
  for (const problem of problems) console.error(problem);
  if (problems.length) process.exitCode = 1;
  const output = JSON.stringify(snapshot, null, 2) + "\n";
  if (values.check) {
    let current = "";
    try {
      current = readFileSync(researchSnapshotPath, "utf8");
    } catch {
      // no snapshot yet
    }
    if (current !== output) {
      console.error("The research snapshot differs: review, then run without --check.");
      process.exitCode = 1;
    } else if (!problems.length) {
      console.log(
        `Replayed ${sources.size} research sources and ${entities.size} answers.`,
      );
    }
  } else if (!problems.length) {
    writeFileSync(researchSnapshotPath, output);
    console.log(
      `Verified ${sources.size} research sources and ${entities.size} answers.`,
    );
  }
} finally {
  databases.classic.close();
  databases.forever.close();
}
