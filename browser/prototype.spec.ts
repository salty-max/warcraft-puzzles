import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, readdirSync } from "node:fs";
import { playIds, preparePlayset } from "../tools/prototype-set.ts";
import {
  expectEntry,
  expectFits,
  expectFontsLoaded,
  letterAt,
  typeEntry,
  viewports,
} from "./helpers.ts";
const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const trials = preparePlayset(
  playIds(readdirSync("content/puzzles")),
  (id) => read(`content/puzzles/${id}.json`),
  read("content/seed/editorial.json"),
  read("content/seed/evidence.json"),
);
const { entries } = trials[0]!.playable;
const total = new Set(entries.flatMap((entry) => entry.cells)).size;
const GO = trials[0]!.route;
/** Sapta, 4 down: a free first square, a crossing at the second and the fifth. */
const molten = entries.find((entry) => entry.id === "4D")!;
const cross = entries.find((entry) => entry.id === "5A")!;
const mainLabel = "4 down (5)";
const A = molten.answer;

test("typing in the grid fills the word, keeps crossings and saves assistance", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(GO);
  await expect(page.locator("#active-label")).toHaveText("1 across (5)");
  await typeEntry(page, molten);
  await expectEntry(page, molten);
  await page.getByRole("button", { name: "Get a hint" }).click();
  await expect(page.locator("#hint-text")).toBeVisible();
  await page.reload();
  await expectEntry(page, molten);
  // The reload starts at the first clue again, so go back to the hinted one.
  await page.locator(`[data-slot="${molten.id}"]`).click();
  await expect(page.locator("#hint-text")).toBeVisible();

  const shared = cross.cells.find((cell) => molten.cells.includes(cell))!;
  const kept = molten.answer[molten.cells.indexOf(shared)]!;
  await page.locator(`[data-slot="${cross.id}"]`).click();
  await page.keyboard.type("X");
  await expect(letterAt(page, shared)).toHaveText(kept);
  const placed = cross.cells.find((cell) => !molten.cells.includes(cell))!;
  await expect(letterAt(page, placed)).toHaveText("X");

  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await page.getByRole("button", { name: "Keep playing" }).click();
  await expectEntry(page, molten);
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await page.getByRole("button", { name: "Clear this puzzle" }).click();
  await expect(page.locator("#progress")).toHaveText(`0 / ${total} letters entered`);
  expect(errors).toEqual([]);
});

test("a whole answer pasted or sent by a phone keyboard still lands letter by letter", async ({
  page,
}) => {
  await page.goto(GO);
  await page.locator('[data-cell="' + molten.cells[0] + '"]').click();
  await page.locator("#keys").fill(A);
  await expectEntry(page, molten);
  await expect(page.locator("#keys")).toHaveValue("");
});

test("check marks wrong squares, and typing over one clears its mark", async ({
  page,
}) => {
  await page.goto(GO);
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
  await page.goto(GO);
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
  await expect(page.locator("#progress")).toHaveText(
    `${total} / ${total} letters entered`,
  );
});

test("keyboard: arrows turn then walk, space turns, backspace deletes, enter moves on", async ({
  page,
}) => {
  await page.goto(GO);
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  await page.keyboard.type(A.slice(0, 2));
  await expect(letterAt(page, molten.cells[1]!)).toHaveText(A[1]!);
  await page.keyboard.press("Backspace");
  await expect(letterAt(page, molten.cells[1]!)).toHaveText("");
  await page.keyboard.press("Backspace");
  await expect(letterAt(page, molten.cells[0]!)).toHaveText("");
  await page.keyboard.press("Enter");
  await expect(page.locator("#active-label")).not.toHaveText(mainLabel);
  await page.keyboard.press("Shift+Enter");
  await expect(page.locator("#active-label")).toHaveText(mainLabel);
  await page.keyboard.press("Space");
  await expect(page.locator("#active-label")).toHaveText(mainLabel);
  const shared = cross.cells.find((cell) => molten.cells.includes(cell))!;
  await page.locator(`[data-cell="${shared}"]`).click();
  await expect(page.locator("#active-label")).toHaveText(mainLabel);
  await page.keyboard.press("Space");
  await expect(page.locator("#active-label")).toHaveText(/across/);
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#active-label")).toHaveText(mainLabel);
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
  await page.goto(GO);
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
  await send({ value: A.slice(0, 1), isComposing: true });
  await send({ value: A.slice(0, 2), isComposing: true });
  await send({ value: A.slice(0, 3), isComposing: true });
  await page.locator("#keys").dispatchEvent("compositionend");
  for (const [offset, letter] of [...A.slice(0, 3)].entries())
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
  await expect(letterAt(page, molten.cells[1]!)).toHaveText(A[1]!);
  /* Space as an input, not a key, turns the word at a crossing and is never a letter. */
  const shared = cross.cells.find((cell) => molten.cells.includes(cell))!;
  await page.locator(`[data-cell="${shared}"]`).click();
  await send({ value: " ", isComposing: false });
  await expect(page.locator("#active-label")).toHaveText(/across/);
});

test("Firefox's order, the end of a composition and then a last input, types each letter once", async ({
  page,
}) => {
  await page.goto(GO);
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
  await send(A.slice(0, 1), true);
  await send(A.slice(0, 2), true);
  /* Firefox sends the last input in the same task as the end of the composition. */
  await page.evaluate(() => {
    const keys = document.getElementById("keys") as HTMLInputElement;
    keys.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    keys.dispatchEvent(new InputEvent("input", { isComposing: false, bubbles: true }));
  });
  await expectEntry(
    page,
    { ...molten, cells: molten.cells.slice(0, 2) },
    A.slice(0, 2),
  );
  await expect(letterAt(page, molten.cells[2]!)).toHaveText("");
  await expect(page.locator("#keys")).toHaveValue("");
});

test("hint and reveal give the keyboard back only when it was in use, check never does", async ({
  page,
}) => {
  await page.goto(GO);
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  await page.keyboard.type(A[0]!);
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

test("an input method's own keys and deletes are left to it while it composes", async ({
  page,
}) => {
  await page.goto(GO);
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  await page.keyboard.type(A.slice(0, 2));
  const label = await page.locator("#active-label").textContent();
  await page.evaluate(() => {
    const keys = document.getElementById("keys")!;
    keys.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true }),
    );
    keys.dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "deleteContentBackward",
        isComposing: true,
        cancelable: true,
        bubbles: true,
      }),
    );
  });
  await expect(page.locator("#active-label")).toHaveText(label!);
  await expect(letterAt(page, molten.cells[0]!)).toHaveText(A[0]!);
  await expect(letterAt(page, molten.cells[1]!)).toHaveText(A[1]!);
});

test("a composition never wipes a crossing's letter, even when it shrinks or is replaced", async ({
  page,
}) => {
  await page.goto(GO);
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
  /* A letter a crossing word gave sits right after where the composition starts. */
  await page.locator(`[data-cell="${molten.cells[1]}"]`).click();
  await page.keyboard.type("X");
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  await send("M", true);
  await send("N", false);
  await expect(letterAt(page, molten.cells[0]!)).toHaveText("N");
  await expect(letterAt(page, molten.cells[1]!)).toHaveText("X");
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  await send("M", true);
  await expect(letterAt(page, molten.cells[0]!)).toHaveText("M");
  await send("", true);
  await expect(letterAt(page, molten.cells[0]!)).toHaveText("N");
  await expect(letterAt(page, molten.cells[1]!)).toHaveText("X");
  /* The composition overwrites the crossing's letter and a shorter one puts it back. */
  await send("MO", true);
  await expect(letterAt(page, molten.cells[1]!)).toHaveText("O");
  await send("M", true);
  await expect(letterAt(page, molten.cells[1]!)).toHaveText("X");
});

test("a button used mid-composition ends it, so a stale copy cannot undo the button", async ({
  page,
}) => {
  await page.goto(GO);
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  const send = (value: string) =>
    page.evaluate((text) => {
      const keys = document.getElementById("keys") as HTMLInputElement;
      keys.value = text;
      keys.dispatchEvent(new InputEvent("input", { isComposing: true, bubbles: true }));
    }, value);
  await send("M");
  /* A press that does not move focus, as on WebKit, where buttons are not focused by a tap. */
  await page.evaluate(() => document.getElementById("reveal")!.click());
  await expect(letterAt(page, molten.cells[3]!)).toHaveText(molten.answer[3]!);
  /* The input method starts afresh after the button, and the reveal stays whole. */
  await send("Q");
  await expect(letterAt(page, molten.cells[3]!)).toHaveText(molten.answer[3]!);
  await expectEntry(
    page,
    { ...molten, cells: molten.cells.slice(2) },
    molten.answer.slice(2),
  );
  await expect(page.locator("#keys")).not.toBeFocused();
});

test("check closes the keyboard and a composition, even when the button does not take focus", async ({
  page,
}) => {
  await page.goto(GO);
  await page.locator(`[data-cell="${molten.cells[0]}"]`).click();
  await page.evaluate(() => {
    const keys = document.getElementById("keys") as HTMLInputElement;
    keys.value = "M";
    keys.dispatchEvent(new InputEvent("input", { isComposing: true, bubbles: true }));
  });
  await expect(page.locator("#keys")).toBeFocused();
  await page.evaluate(() => document.getElementById("check")!.click());
  await expect(page.locator("#keys")).not.toBeFocused();
});

test("a commit that differs from the composed word replaces it, and a cancelled composition keeps it", async ({
  page,
}) => {
  await page.goto(GO);
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
  await send("T", true);
  await send("TE", true);
  await send("TEH", true);
  await send("THE", false);
  for (const [offset, letter] of [..."THE"].entries())
    await expect(letterAt(page, molten.cells[offset]!)).toHaveText(letter);
  await expect(letterAt(page, molten.cells[3]!)).toHaveText("");
  await send("O", true);
  await send("OR", true);
  await send("", false);
  await expect(letterAt(page, molten.cells[3]!)).toHaveText("O");
  await expect(letterAt(page, molten.cells[4]!)).toHaveText("R");
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
  await page.goto(`http://127.0.0.1:4173${GO}`);
  await page.locator(`[data-cell="${molten.cells[2]}"]`).tap();
  await expect(page.locator("#keys")).toBeFocused();
  await page.locator("#keys").fill("l");
  await expect(letterAt(page, molten.cells[2]!)).toHaveText("L");
  await page.getByRole("button", { name: "Get a hint" }).tap();
  await expect(page.locator("#keys")).toBeFocused();
  await page.getByRole("button", { name: "Check puzzle" }).tap();
  await expect(page.locator("#keys")).not.toBeFocused();
  await context.close();
});

for (const [index, trial] of trials.entries()) {
  for (const viewport of viewports) {
    for (const scheme of ["light", "dark"] as const) {
      if (scheme === "dark" && ![390, 1280].includes(viewport.width)) continue;
      // The first puzzle at all five sizes, the rest at the phone in light only,
      // and the taller grids also on a tablet and sideways on a phone.
      const tall = trial.playable.height > trials[0]!.playable.height;
      const wanted = [390, ...(tall ? [768, 844] : [])].includes(viewport.width);
      if (index > 0 && !(wanted && scheme === "light")) continue;
      test(`${trial.id} layout and accessibility at ${viewport.width}×${viewport.height}, ${scheme}`, async ({
        page,
      }, testInfo) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize(viewport);
        await page.goto(trial.route);
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
  await page.goto(GO);
  await typeEntry(page, molten);
  await expectEntry(page, molten);
  await expect(page.locator("#storage-warning")).toBeVisible();
});

test("the archive lists every play puzzle by number and title, in order", async ({
  page,
}) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    const links = page.locator(".puzzle-list a");
    await expect(links).toHaveCount(trials.length);
    for (const [index, trial] of trials.entries()) {
      await expect(links.nth(index)).toHaveAttribute("href", trial.route);
      await expect(links.nth(index).locator(".no")).toHaveText(String(trial.number));
      await expect(links.nth(index).locator(".level")).toHaveText(trial.playable.title);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
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

test("puzzles open from the archive, take an answer and keep their own save", async ({
  page,
}) => {
  const ends = [...new Set([trials[0]!, trials.at(-1)!])];
  await page.goto("/");
  for (const trial of ends) {
    await page.locator(`.puzzle-list a[href="${trial.route}"]`).click();
    await expect(page.locator(".difficulty")).toHaveText(trial.playable.title);
    await expect(page.locator(".clues button")).toHaveCount(
      trial.playable.entries.length,
    );
    await expect(page.locator("#progress")).toContainText("0 /");
    await typeEntry(page, trial.playable.entries[0]!);
    await expectEntry(page, trial.playable.entries[0]!);
    await page.getByRole("link", { name: "All crosswords" }).first().click();
  }
  for (const trial of ends) {
    await page.locator(`.puzzle-list a[href="${trial.route}"]`).click();
    await expectEntry(page, trial.playable.entries[0]!);
    await page.getByRole("link", { name: "All crosswords" }).first().click();
  }
});

test("the last puzzle can be completed and stays complete after a reload", async ({
  page,
}) => {
  for (const trial of [trials.at(-1)!]) {
    await page.goto(trial.route);
    for (const entry of trial.playable.entries) await typeEntry(page, entry);
    await expect(page.locator("#complete")).toBeVisible();
    await page.reload();
    await expect(page.locator("#complete")).toBeVisible();
  }
});

test("a wrong letter blocks completion until it is corrected", async ({ page }) => {
  const trial = trials.at(-1)!;
  await page.goto(trial.route);
  const [only, ...rest] = trial.playable.entries;
  for (const entry of rest) await typeEntry(page, entry);
  await typeEntry(page, only!, "Q".repeat(only!.answer.length));
  await expect(page.locator("#complete")).toBeHidden();
  await typeEntry(page, only!);
  await expect(page.locator("#complete")).toBeVisible();
});
