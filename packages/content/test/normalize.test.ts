import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { enumerateAnswer, normalizeAnswer } from "../src/index.ts";

describe("English answer spelling", () => {
  it.each([
    ["FATHER", "FATHER", [6]],
    ["Kirin Tor", "KIRINTOR", [5, 3]],
    ["The Lich King", "THELICHKING", [3, 4, 4]],
    ["Onyxia's Lair", "ONYXIASLAIR", [7, 4]],
    ["The Dark Portal", "THEDARKPORTAL", [3, 4, 6]],
    ["Zul'Gurub", "ZULGURUB", [8]],
    ["Ner’zhul", "NERZHUL", [7]],
    ["War-chief", "WARCHIEF", [3, 5]],
    ["  Ice Crown  ", "ICECROWN", [3, 5]],
  ])("preserves the spelling of %s", (display, grid, enumeration) => {
    expect(normalizeAnswer(display)).toBe(grid);
    expect(enumerateAnswer(display)).toEqual(enumeration);
  });

  it.each([
    "",
    "  ",
    "R2D2",
    "??",
    "Zul''Gurub",
    "-word",
    "word-",
    "café",
    "two  words",
    "word\nword",
  ])("rejects unsupported spelling %j", (answer) => {
    expect(() => normalizeAnswer(answer)).toThrow("Unsupported answer spelling");
  });

  it("preserves every letter of valid answers and the total enumeration", () => {
    const word = fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz"), {
        minLength: 1,
        maxLength: 15,
      })
      .map((letters) => letters.join(""));
    fc.assert(
      fc.property(fc.array(word, { minLength: 1, maxLength: 4 }), (words) => {
        const display = words.join(" ");
        expect(normalizeAnswer(display)).toBe(words.join("").toUpperCase());
        expect(enumerateAnswer(display).reduce((a, b) => a + b, 0)).toBe(
          normalizeAnswer(display).length,
        );
      }),
      { seed: 20261101, numRuns: 200 },
    );
  });
});
