import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { preparePilot, trialRoute } from "../tools/pilot.ts";
import {
  expectEntry,
  expectFits,
  expectFontsLoaded,
  typeEntry,
  viewports,
} from "./helpers.ts";
const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const { trials } = preparePilot(
  read("content/puzzles/pilot.json"),
  (id) => read(`content/puzzles/${id}.json`),
  read("content/seed/editorial.json"),
  read("content/seed/evidence.json"),
);
const cardName = (index: number, label: string) =>
  new RegExp(`^${index + 1} ${label} \\d+ clues`);

for (const trial of trials.slice(2)) {
  test(`${trial.id}: all responsive sizes and accessibility`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    for (const viewport of viewports) {
      for (const scheme of ["light", "dark"] as const) {
        if (scheme === "dark" && viewport.width !== 390) continue;
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize(viewport);
        await page.goto(trialRoute(trial));
        await page.locator(".clues button").first().click();
        await expect(page.locator("#keys")).toBeFocused();
        await expectFits(page, viewport.width);
        await expect(page.locator("#grid td.in-entry")).not.toHaveCount(0);
        expect(
          (
            await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze()
          ).violations,
        ).toEqual([]);
        await testInfo.attach(`${trial.id}-${viewport.width}-${scheme}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      }
    }
  });
}
test("all five new puzzles can be completed and resumed without assistance", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const trial of trials.slice(2)) {
    await page.goto(trialRoute(trial));
    await expect(page.locator("#progress")).toContainText("0 /");
    for (const entry of trial.playable.entries) await typeEntry(page, entry);
    await expect(page.locator("#complete")).toBeVisible();
    await expect(page.locator("#completion-summary")).toHaveText(
      "No hints, reveals or checks.",
    );
    await page.reload();
    await expect(page.locator("#complete")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("a wrong letter blocks completion until it is corrected", async ({ page }) => {
  const trial = trials[3]!;
  await page.goto(trialRoute(trial));
  const [only, ...rest] = trial.playable.entries;
  for (const entry of rest) await typeEntry(page, entry);
  await typeEntry(page, only!, "Q".repeat(only!.answer.length));
  await expect(page.locator("#complete")).toBeHidden();
  await typeEntry(page, only!);
  await expect(page.locator("#complete")).toBeVisible();
});
test("index navigation keeps all seven partial solves separate", async ({ page }) => {
  await page.goto("/pilot");
  for (const [index, trial] of trials.entries()) {
    await page.getByRole("link", { name: cardName(index, trial.label) }).click();
    await expect(page.locator("#progress")).toContainText("0 /");
    await typeEntry(page, trial.playable.entries[0]!);
    await page.getByRole("link", { name: "All crosswords" }).first().click();
  }
  for (const [index, trial] of trials.entries()) {
    await page.getByRole("link", { name: cardName(index, trial.label) }).click();
    await expectEntry(page, trial.playable.entries[0]!);
    await page.getByRole("link", { name: "All crosswords" }).first().click();
  }
});
test("the archive page is accessible in both schemes and fits a phone", async ({
  page,
}) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/pilot");
    await expect(page.locator(".pilot-list a")).toHaveCount(7);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(320);
    await expectFontsLoaded(page);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  }
});
test("portable index reaches all seven trials without network requests", async ({
  page,
}) => {
  const remote: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) remote.push(request.url());
  });
  await page.goto(pathToFileURL(resolve(".cache/prototype/pilot.html")).href);
  for (const [index, trial] of trials.entries()) {
    await page.getByRole("link", { name: cardName(index, trial.label) }).click();
    await expect(page.locator(".difficulty")).toHaveText(trial.label);
    await expect(page.locator(".clues button")).toHaveCount(
      trial.playable.entries.length,
    );
    await typeEntry(page, trial.playable.entries[0]!);
    await expectEntry(page, trial.playable.entries[0]!);
    await page.getByRole("link", { name: "All crosswords" }).first().click();
  }
  expect(remote).toEqual([]);
});
