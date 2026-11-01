import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { prepareResearchPuzzle } from "../tools/research-puzzle.ts";
import {
  expectEntry,
  expectFits,
  expectFontsLoaded,
  letterAt,
  typeEntry,
  viewports,
} from "./helpers.ts";
const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const prepare = (id: string) =>
  prepareResearchPuzzle(
    read(`content/puzzles/${id}.json`),
    read("content/seed/editorial.json"),
    read("content/seed/evidence.json"),
  ).playable;
const { entries } = prepare("first-steps");
const molten = entries.find((entry) => entry.id === "1D")!;
const cross = entries.find((entry) => entry.id === "2A")!;

test("typing in the grid fills the word, keeps crossings and saves assistance", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#active-label")).toHaveText("1 down (6,4)");
  await typeEntry(page, molten);
  await expectEntry(page, molten);
  await page.getByRole("button", { name: "Get a hint" }).click();
  await expect(page.locator("#hint-text")).toBeVisible();
  await page.reload();
  await expectEntry(page, molten);
  await expect(page.locator("#hint-text")).toBeVisible();

  const shared = cross.cells.find((cell) => molten.cells.includes(cell))!;
  const kept = molten.answer[molten.cells.indexOf(shared)]!;
  await page.locator(`[data-slot="2A"]`).click();
  await page.keyboard.type("X");
  await expect(letterAt(page, shared)).toHaveText(kept);
  const placed = cross.cells.find((cell) => !molten.cells.includes(cell))!;
  await expect(letterAt(page, placed)).toHaveText("X");

  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await page.getByRole("button", { name: "Keep playing" }).click();
  await expectEntry(page, molten);
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await page.getByRole("button", { name: "Clear this puzzle" }).click();
  await expect(page.locator("#progress")).toHaveText("0 / 47 letters entered");
  expect(errors).toEqual([]);
});

test("a whole answer pasted or sent by a phone keyboard still lands letter by letter", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-cell="' + molten.cells[0] + '"]').click();
  await page.locator("#keys").fill("Molten Core");
  await expectEntry(page, molten);
  await expect(page.locator("#keys")).toHaveValue("");
});

test("check marks wrong squares, and typing over one clears its mark", async ({
  page,
}) => {
  await page.goto("/");
  await typeEntry(page, molten, "XXXXXXXXXX");
  await page.getByRole("button", { name: "Check puzzle" }).click();
  await expect(page.locator("#feedback")).toContainText("wrong squares are marked");
  const first = page.locator(`[data-cell="${molten.cells[0]}"]`).locator("..");
  await expect(first).toHaveClass(/wrong/);
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  await page.keyboard.type(molten.answer[0]!);
  await expect(first).not.toHaveClass(/wrong/);
  await expect(page.locator("#feedback")).toHaveText("");
});

test("complete solve and distinct hint/reveal accounting survive reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Get a hint" }).click();
  await page.getByRole("button", { name: "Get a hint" }).click();
  await page.getByRole("button", { name: "Reveal this answer" }).click();
  await page.getByRole("button", { name: "Reveal this answer" }).click();
  for (const entry of entries) await typeEntry(page, entry);
  await expect(page.getByRole("heading", { name: "Puzzle complete" })).toBeVisible();
  await expect(page.locator("#completion-summary")).toContainText(
    "1 hint, 1 reveal and 0 checks",
  );
  await page.reload();
  await expect(page.locator("#complete")).toBeVisible();
  await expect(page.locator("#progress")).toHaveText("47 / 47 letters entered");
});

test("keyboard: arrows turn then walk, space turns, backspace deletes, enter moves on", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  await page.keyboard.type("MO");
  await expect(letterAt(page, molten.cells[1]!)).toHaveText("O");
  await page.keyboard.press("Backspace");
  await expect(letterAt(page, molten.cells[1]!)).toHaveText("");
  await page.keyboard.press("Backspace");
  await expect(letterAt(page, molten.cells[0]!)).toHaveText("");
  await page.keyboard.press("Enter");
  await expect(page.locator("#active-label")).not.toHaveText("1 down (6,4)");
  await page.keyboard.press("Shift+Enter");
  await expect(page.locator("#active-label")).toHaveText("1 down (6,4)");
  await page.keyboard.press("Space");
  await expect(page.locator("#active-label")).toHaveText("1 down (6,4)");
  const shared = cross.cells.find((cell) => molten.cells.includes(cell))!;
  await page.locator(`[data-cell="${shared}"]`).click();
  await expect(page.locator("#active-label")).toHaveText("1 down (6,4)");
  await page.keyboard.press("Space");
  await expect(page.locator("#active-label")).toHaveText(/across/);
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#active-label")).toHaveText("1 down (6,4)");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#grid td.cursor button")).toHaveAttribute(
    "data-cell",
    String(molten.cells[molten.cells.indexOf(shared) + 1]),
  );
  await page.getByRole("button", { name: "Previous clue" }).click();
  await expect(page.locator("#keys")).toBeFocused();
});

test("a phone keyboard's delete, space and composing buffer are handled once", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  const send = (init: { value: string; isComposing: boolean }) =>
    page.evaluate((i) => {
      const keys = document.getElementById("keys") as HTMLInputElement;
      keys.value = i.value;
      keys.dispatchEvent(
        new InputEvent("input", { isComposing: i.isComposing, bubbles: true }),
      );
    }, init);
  /* A composing keyboard resends its whole buffer each time: M, then MO, then MOL. */
  await send({ value: "M", isComposing: true });
  await send({ value: "MO", isComposing: true });
  await send({ value: "MOL", isComposing: true });
  await page.locator("#keys").dispatchEvent("compositionend");
  for (const [offset, letter] of [..."MOL"].entries())
    await expect(letterAt(page, molten.cells[offset]!)).toHaveText(letter);
  await expect(letterAt(page, molten.cells[3]!)).toHaveText("");
  /* Delete as the phone sends it, with no key behind it. */
  await page.evaluate(() =>
    document.getElementById("keys")!.dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "deleteContentBackward",
        cancelable: true,
        bubbles: true,
      }),
    ),
  );
  await expect(letterAt(page, molten.cells[2]!)).toHaveText("");
  await expect(letterAt(page, molten.cells[1]!)).toHaveText("O");
  /* Space as an input, not a key, turns the word at a crossing and is never a letter. */
  const shared = cross.cells.find((cell) => molten.cells.includes(cell))!;
  await page.locator(`[data-cell="${shared}"]`).click();
  await send({ value: " ", isComposing: false });
  await expect(page.locator("#active-label")).toHaveText(/across/);
});

test("Firefox's order, the end of a composition and then a last input, types each letter once", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  const send = (value: string, isComposing: boolean) =>
    page.evaluate(
      ([text, composing]) => {
        const keys = document.getElementById("keys") as HTMLInputElement;
        keys.value = text as string;
        keys.dispatchEvent(
          new InputEvent("input", { isComposing: composing as boolean, bubbles: true }),
        );
      },
      [value, isComposing],
    );
  await send("M", true);
  await send("MO", true);
  /* Firefox sends the last input in the same task as the end of the composition. */
  await page.evaluate(() => {
    const keys = document.getElementById("keys") as HTMLInputElement;
    keys.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    keys.dispatchEvent(new InputEvent("input", { isComposing: false, bubbles: true }));
  });
  await expectEntry(page, { ...molten, cells: molten.cells.slice(0, 2) }, "MO");
  await expect(letterAt(page, molten.cells[2]!)).toHaveText("");
  await expect(page.locator("#keys")).toHaveValue("");
});

test("hint and reveal give the keyboard back only when it was in use, check never does", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  await page.keyboard.type("M");
  await page.getByRole("button", { name: "Get a hint" }).click();
  await expect(page.locator("#keys")).toBeFocused();
  await page.getByRole("button", { name: "Check puzzle" }).click();
  await expect(page.locator("#keys")).not.toBeFocused();
  const reveal = page.getByRole("button", { name: "Reveal this answer" });
  await reveal.focus();
  await reveal.press("Enter");
  await expect(reveal).toBeFocused();
  await expect(page.locator("#feedback")).toHaveText("Answer revealed.");
});

test("a tap on a square brings up the keyboard and typing works", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await page.locator(`[data-cell="${molten.cells[2]}"]`).tap();
  await expect(page.locator("#keys")).toBeFocused();
  await page.locator("#keys").fill("l");
  await expect(letterAt(page, molten.cells[2]!)).toHaveText("L");
  await context.close();
});

for (const edition of [
  { label: "Easy", url: "/" },
  { label: "Medium", url: "/medium" },
]) {
  for (const viewport of viewports) {
    for (const scheme of ["light", "dark"] as const) {
      if (scheme === "dark" && ![390, 1280].includes(viewport.width)) continue;
      test(`${edition.label} layout and accessibility at ${viewport.width}×${viewport.height}, ${scheme}`, async ({
        page,
      }, testInfo) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize(viewport);
        await page.goto(edition.url);
        await expect(page.locator("#keys")).toBeAttached();
        await expectFits(page, viewport.width);
        await page.locator(".clues button").first().click();
        await expect(page.locator("#keys")).toBeFocused();
        await expect(page.locator("#grid td.in-entry")).not.toHaveCount(0);
        await expectFontsLoaded(page);
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
  }
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
  await typeEntry(page, molten);
  await expectEntry(page, molten);
  await expect(page.locator("#storage-warning")).toBeVisible();
});

test("portable HTML runs without a server or external assets, with its fonts inside", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    requests.push(request.url());
  });
  await page.goto(pathToFileURL(resolve(".cache/prototype/playtest.html")).href);
  await expect(page.locator("#active-label")).toHaveText("1 down (6,4)");
  await typeEntry(page, molten);
  await expectEntry(page, molten);
  await expectFontsLoaded(page);
  expect(requests.filter((url) => /^https?:/.test(url))).toEqual([]);
});

const medium = prepare("medium-steps");
test("Medium solve resumes independently of the first puzzle", async ({ page }) => {
  await page.goto("/");
  await typeEntry(page, molten);
  await page.goto("/medium");
  await expect(page.locator(".difficulty")).toHaveText("Medium");
  await expect(page.locator("#progress")).toContainText("0 /");
  await page.getByRole("button", { name: "Get a hint" }).click();
  for (const entry of medium.entries) await typeEntry(page, entry);
  await expect(page.locator("#complete")).toBeVisible();
  await expect(page.locator("#completion-summary")).toContainText(
    "1 hint, 0 reveals and 0 checks",
  );
  await page.goto("/");
  await expectEntry(page, molten);
  await expect(page.locator("#complete")).toBeHidden();
  await page.goto("/medium");
  await expect(page.locator("#complete")).toBeVisible();
});

test("portable Medium trial has its own content and no remote requests", async ({
  page,
}) => {
  const remote: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) remote.push(request.url());
  });
  await page.goto(pathToFileURL(resolve(".cache/prototype/medium.html")).href);
  await expect(page.locator(".difficulty")).toHaveText("Medium");
  await expect(page.locator(".clues button")).toHaveCount(15);
  await typeEntry(page, medium.entries[0]!);
  await expectEntry(page, medium.entries[0]!);
  expect(remote).toEqual([]);
});
