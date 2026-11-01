import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { prepareResearchPuzzle } from "../tools/research-puzzle.ts";
const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const { playable } = prepareResearchPuzzle(
  read("content/puzzles/first-steps.json"),
  read("content/seed/editorial.json"),
  read("content/seed/evidence.json"),
);

test("whole-answer entry, multi-word enumeration, crossing edits and saved assistance", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#active-label")).toHaveText("1 down (6,4)");
  await page.getByRole("textbox").fill("Molten Core");
  await expect(page.locator("#pattern")).toHaveText("MOLTENCORE");
  await page.getByRole("button", { name: "Get a hint" }).click();
  await expect(page.locator("#hint-text")).toBeVisible();
  await page.reload();
  await expect(page.locator("#pattern")).toHaveText("MOLTENCORE");
  await expect(page.locator("#hint-text")).toBeVisible();
  const cross = playable.entries.find((e) => e.id === "2A")!;
  const intersect = cross.cells.find((cell) =>
    playable.entries[0]!.cells.includes(cell),
  )!;
  await page.locator('[data-slot="2A"]').click();
  await page.getByRole("textbox").fill("XYZ");
  await page.locator('[data-slot="1D"]').click();
  await expect(page.locator("#pattern")).not.toHaveText("MOLTENCORE");
  const square = page
    .locator("#grid button")
    .filter({ has: page.locator(".letter", { hasText: "X" }) });
  expect(intersect).toBeGreaterThanOrEqual(0);
  await expect(square.first()).toBeVisible();
  await page.getByRole("button", { name: "Check puzzle" }).click();
  await expect(page.getByRole("status")).toContainText("counts as assistance");
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await page.getByRole("button", { name: "Keep playing" }).click();
  await expect(page.locator("#pattern")).not.toHaveText("··········");
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await page.getByRole("button", { name: "Clear this puzzle" }).click();
  await expect(page.locator("#progress")).toHaveText("0 / 47 letters entered");
  expect(errors).toEqual([]);
});

test("complete solve and distinct hint/reveal accounting survive reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Get a hint" }).click();
  await page.getByRole("button", { name: "Get a hint" }).click();
  await page.getByRole("button", { name: "Reveal this answer" }).click();
  await page.getByRole("button", { name: "Reveal this answer" }).click();
  for (const entry of playable.entries) {
    await page.locator(`[data-slot="${entry.id}"]`).click();
    await page.getByRole("textbox").fill(entry.answer);
  }
  await expect(page.getByRole("heading", { name: "Puzzle complete." })).toBeVisible();
  await expect(page.locator("#completion-summary")).toContainText(
    "1 hint, 1 reveal and 0 checks",
  );
  await page.reload();
  await expect(page.locator("#complete")).toBeVisible();
  await expect(page.locator("#progress")).toHaveText("47 / 47 letters entered");
});

test("keyboard clue navigation and grid arrows remain usable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox").fill("Molten Core");
  await page.getByRole("textbox").press("Enter");
  await expect(page.locator("#active-label")).toHaveText("2 across (3)");
  await expect(page.getByRole("textbox")).toBeFocused();
  await page.getByRole("button", { name: "Previous clue" }).click();
  await expect(page.locator("#active-label")).toHaveText("1 down (6,4)");
  const firstCell = page.locator('#grid button[tabindex="0"]');
  await firstCell.focus();
  await firstCell.press("ArrowDown");
  await expect(page.locator("#grid button:focus")).toHaveCount(1);
  await expect(page.locator("#grid button:focus")).not.toHaveAttribute(
    "aria-label",
    /Row 1,/,
  );
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 844, height: 390 },
]) {
  test(`layout and accessibility at ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("textbox")).toBeVisible();
    const size = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      view: window.innerWidth,
    }));
    expect(size.scroll).toBeLessThanOrEqual(size.view);
    const grid = await page.locator("#grid").boundingBox();
    expect(grid!.width).toBeLessThanOrEqual(viewport.width);
    expect(grid!.x).toBeGreaterThanOrEqual(0);
    await page.locator('[data-slot="8A"]').click();
    await expect(page.getByRole("textbox")).toBeFocused();
    await expect(page.locator("#grid button.active")).not.toHaveCount(0);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await testInfo.attach("layout", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}

test("storage denial and corrupt saves do not prevent play", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value: () => {
        throw new Error("Storage blocked");
      },
    });
    Object.defineProperty(Storage.prototype, "getItem", { value: () => "broken json" });
  });
  await page.goto("/");
  await page.getByRole("textbox").fill("Molten Core");
  await expect(page.locator("#pattern")).toHaveText("MOLTENCORE");
  await expect(page.locator("#storage-warning")).toBeVisible();
});

test("portable HTML runs without a server or external assets", async ({ page }) => {
  const { pathToFileURL } = await import("node:url");
  const { resolve } = await import("node:path");
  const requests: string[] = [];
  page.on("request", (request) => {
    requests.push(request.url());
  });
  await page.goto(pathToFileURL(resolve(".cache/prototype/playtest.html")).href);
  await expect(page.locator("#active-label")).toHaveText("1 down (6,4)");
  await page.getByRole("textbox").fill("Molten Core");
  await expect(page.locator("#pattern")).toHaveText("MOLTENCORE");
  expect(requests.filter((url) => /^https?:/.test(url))).toEqual([]);
});
