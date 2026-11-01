import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { preparePilot, trialRoute } from "../tools/pilot.ts";
const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const { trials } = preparePilot(
  read("content/puzzles/pilot.json"),
  (id) => read(`content/puzzles/${id}.json`),
  read("content/seed/editorial.json"),
  read("content/seed/evidence.json"),
);
const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 844, height: 390 },
];
for (const trial of trials.slice(2)) {
  test(`${trial.id}: all responsive sizes and accessibility`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(trialRoute(trial));
      await page.locator(".clues button").first().click();
      await expect(page.getByRole("textbox")).toBeFocused();
      const dimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
      const box = await page.locator("#grid").boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      await expect(page.locator("#grid button.active")).not.toHaveCount(0);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await testInfo.attach(`${trial.id}-${viewport.width}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    }
  });
}
test("all five new puzzles can be completed and resumed without assistance", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const trial of trials.slice(2)) {
    await page.goto(trialRoute(trial));
    await expect(page.locator("#progress")).toContainText("0 /");
    for (const entry of trial.playable.entries) {
      await page.locator(`[data-slot="${entry.id}"]`).click();
      await page.getByRole("textbox").fill(entry.answer);
    }
    await expect(page.locator("#complete")).toBeVisible();
    await expect(page.locator("#completion-summary")).toHaveText(
      "No hints, reveals or checks.",
    );
    await page.reload();
    await expect(page.locator("#complete")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("index navigation keeps all seven partial solves separate", async ({ page }) => {
  await page.goto("/pilot");
  for (const [index, trial] of trials.entries()) {
    await page
      .getByRole("link", { name: `${index + 1}. ${trial.label}`, exact: true })
      .click();
    await expect(page.locator("#progress")).toContainText("0 /");
    await page.getByRole("textbox").fill(trial.playable.entries[0]!.answer);
    await page.getByRole("link", { name: "All crosswords" }).click();
  }
  for (const [index, trial] of trials.entries()) {
    await page
      .getByRole("link", { name: `${index + 1}. ${trial.label}`, exact: true })
      .click();
    await expect(page.locator("#pattern")).toHaveText(
      trial.playable.entries[0]!.answer,
    );
    await page.getByRole("link", { name: "All crosswords" }).click();
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
    await page
      .getByRole("link", { name: `${index + 1}. ${trial.label}`, exact: true })
      .click();
    await expect(page.locator(".difficulty")).toHaveText(trial.label);
    await expect(page.locator(".clues button")).toHaveCount(
      trial.playable.entries.length,
    );
    await page.getByRole("textbox").fill(trial.playable.entries[0]!.answer);
    await expect(page.locator("#pattern")).toHaveText(
      trial.playable.entries[0]!.answer,
    );
    await page.getByRole("link", { name: "All crosswords" }).click();
  }
  expect(remote).toEqual([]);
});
