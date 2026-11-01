import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { z } from "zod";
import { root } from "./io.ts";

const temporary: string[] = [];
afterEach(() => {
  for (const directory of temporary.splice(0))
    rmSync(directory, { recursive: true, force: true });
});
const command = (args: string[]) =>
  spawnSync(process.execPath, ["tools/benchmark-fill.ts", ...args], {
    cwd: root,
    encoding: "utf8",
  });

it("generates report and measured artifact, then rejects stale/invalid inputs", () => {
  const directory = mkdtempSync(join(tmpdir(), "warcraft-benchmark-"));
  temporary.push(directory);
  const output = join(directory, "report.md");
  const artifact = join(directory, "measurements/latest.json");
  const args = ["--output", output, "--artifact", artifact];
  const generated = command(args);
  expect(generated.status, generated.stderr).toBe(0);
  const measured = z
    .object({
      mode: z.literal("unpublished-research"),
      cases: z.array(z.unknown()).min(1),
      measurement: z.object({
        elapsedMs: z.number().nonnegative(),
        node: z.string(),
        cases: z.array(z.object({ elapsedMs: z.number().nonnegative() })),
      }),
    })
    .parse(JSON.parse(readFileSync(artifact, "utf8")) as unknown);
  expect(measured.measurement.node).toBe(process.version);
  expect(measured.measurement.cases).toHaveLength(measured.cases.length);
  const original = readFileSync(artifact, "utf8");
  expect(command([...args, "--check"]).status).toBe(0);
  expect(readFileSync(artifact, "utf8")).toBe(original);
  writeFileSync(output, "Stale");
  const stale = command([...args, "--check"]);
  expect(stale.status).toBe(1);
  expect(stale.stderr).toContain("stale");
  expect(command([...args, "--chek"]).status).not.toBe(0);
  expect(
    command([...args, "--config", join(directory, "absent.json")]).status,
  ).not.toBe(0);
  const invalid = join(directory, "invalid.json");
  writeFileSync(invalid, JSON.stringify({ schemaVersion: 99 }));
  expect(command([...args, "--config", invalid]).status).not.toBe(0);
});
