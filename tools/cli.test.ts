import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { fixture } from "../packages/content/test/fixture.ts";
import { SnapshotSchema } from "../packages/content/src/index.ts";
import { root } from "./io.ts";

const temporary: string[] = [];
afterEach(() => {
  for (const directory of temporary.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function temporaryFixture() {
  const directory = mkdtempSync(join(tmpdir(), "warcraft-content-"));
  temporary.push(directory);
  const { editorial, snapshot } = fixture();
  const catalogue = join(directory, "editorial.json");
  const evidence = join(directory, "evidence.json");
  writeFileSync(catalogue, JSON.stringify(editorial));
  writeFileSync(evidence, JSON.stringify(snapshot));
  return { directory, catalogue, evidence, editorial };
}

function command(tool: string, args: string[] = []) {
  return spawnSync(process.execPath, [`tools/${tool}.ts`, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

it("runs the research gate and fails closed for publication and invalid flags", () => {
  const { catalogue, evidence } = temporaryFixture();
  const args = ["--catalogue", catalogue, "--evidence", evidence];
  expect(command("check-content", args).status).toBe(0);
  const publication = command("check-content", [...args, "--publication"]);
  expect(publication.status).toBe(1);
  expect(publication.stderr).toContain("unapproved");
  expect(command("check-content", [...args, "--publcation"]).status).not.toBe(0);
});

it("generates reports and rejects stale output", () => {
  const { directory, catalogue, evidence } = temporaryFixture();
  const output = join(directory, "report.md");
  const args = ["--catalogue", catalogue, "--evidence", evidence, "--output", output];
  expect(command("report-content", args).status).toBe(0);
  expect(command("report-content", [...args, "--check"]).status).toBe(0);
  writeFileSync(output, "Outdated report");
  expect(command("report-content", [...args, "--check"]).status).toBe(1);
  expect(command("report-content", [...args, "--chek"]).status).not.toBe(0);
});

it("replays book and quest citations against a real read-only SQLite fixture", () => {
  const { directory, catalogue, editorial } = temporaryFixture();
  const databasePath = join(directory, "research.db");
  const output = join(directory, "source-snapshot.json");
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
    INSERT INTO meta VALUES ('game', 'classic');
    CREATE TABLE source (name TEXT PRIMARY KEY, version TEXT, url TEXT, license TEXT);
    INSERT INTO source VALUES ('classicdb', 'fixture-version', 'https://example.com', 'synthetic');
    CREATE TABLE readable_page (kind TEXT, id INTEGER, locale TEXT, idx INTEGER, text TEXT, source TEXT);
    CREATE TABLE quest_text (quest_id INTEGER, locale TEXT, field TEXT, text TEXT, source TEXT);
  `);
  database
    .prepare("INSERT INTO readable_page VALUES (?, ?, ?, ?, ?, ?)")
    .run("object", 1, "enUS", 1, "A father has a child.", "classicdb");
  database
    .prepare("INSERT INTO quest_text VALUES (?, ?, ?, ?, ?)")
    .run(141, "enUS", "details", "An exact quest citation.", "classicdb");
  database.close();
  editorial.citations.push({
    id: "quest-citation",
    locator: { table: "quest_text", quest_id: 141, locale: "enUS", field: "details" },
    excerpt: "An exact quest citation.",
  });
  writeFileSync(catalogue, JSON.stringify(editorial));
  const args = [
    "--database",
    databasePath,
    "--catalogue",
    catalogue,
    "--output",
    output,
  ];
  const before = readFileSync(databasePath);
  const result = command("refresh-evidence", args);
  expect(result.status, result.stderr).toBe(0);
  const snapshot = SnapshotSchema.parse(JSON.parse(readFileSync(output, "utf8")));
  expect(snapshot.evidence).toHaveLength(2);
  expect(command("refresh-evidence", [...args, "--check"]).status).toBe(0);
  expect(readFileSync(databasePath)).toEqual(before);

  const changed = new DatabaseSync(databasePath);
  changed.exec("INSERT INTO meta VALUES ('unrelated', 'change')");
  changed.close();
  const mismatch = command("refresh-evidence", [...args, "--check"]);
  expect(mismatch.status).not.toBe(0);
  expect(mismatch.stderr).toContain("Evidence snapshot differs");
  expect(command("refresh-evidence", ["--check"]).status).not.toBe(0);
});

it("rejects corrupt input without reporting success", () => {
  const { catalogue, evidence } = temporaryFixture();
  writeFileSync(catalogue, "not JSON");
  expect(() =>
    execFileSync(
      process.execPath,
      ["tools/check-content.ts", "--catalogue", catalogue, "--evidence", evidence],
      { cwd: root, stdio: "pipe" },
    ),
  ).toThrow();
});
