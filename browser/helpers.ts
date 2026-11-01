import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { PlayEntry } from "../web/model.ts";

export const letterAt = (page: Page, cell: number) =>
  page.locator(`[data-cell="${cell}"] .letter`);

/** Chooses a clue, goes to its first square and types its answer, one key at a time. */
export async function typeEntry(page: Page, entry: PlayEntry, answer = entry.answer) {
  await page.locator(`[data-slot="${entry.id}"]`).click();
  await page.locator("#keys").press("Home");
  await page.keyboard.type(answer);
}

export async function expectEntry(page: Page, entry: PlayEntry, answer = entry.answer) {
  for (const [offset, cell] of entry.cells.entries())
    await expect(letterAt(page, cell)).toHaveText(answer[offset] ?? "");
}

export const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 844, height: 390 },
];

/** No sideways scroll, and the whole board inside the screen. */
export async function expectFits(page: Page, width: number) {
  const size = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    view: window.innerWidth,
  }));
  expect(size.scroll).toBeLessThanOrEqual(size.view);
  const box = await page.locator("#grid").boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(width);
}

/** Both families are really loaded, from the server or from inside the file. */
export async function expectFontsLoaded(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => [
        ...new Set(
          [...document.fonts]
            .filter((face) => face.status === "loaded")
            .map((face) => face.family.replace(/"/g, "")),
        ),
      ]),
    )
    .toEqual(expect.arrayContaining(["Cinzel", "EB Garamond"]));
}
