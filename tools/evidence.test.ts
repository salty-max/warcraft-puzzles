import { expect, it } from "vitest";
import { canonicalRow, verifyCitation } from "./evidence.ts";
import { fixture } from "../packages/content/test/fixture.ts";
import { CitationSchema } from "../packages/content/src/index.ts";

it("verifies exact excerpts and fingerprints source rows deterministically", () => {
  const { editorial } = fixture();
  const citation = editorial.citations[0]!;
  const result = verifyCitation(citation, () => ({
    source: "classicdb",
    text: `Prefix ${citation.excerpt} Suffix`,
  }));
  expect(result.sourceId).toBe("classicdb");
  expect(result.rowSha256).toHaveLength(64);
  expect(canonicalRow({ b: 2, a: 1 })).toBe(canonicalRow({ a: 1, b: 2 }));
});

it("rejects missing rows, invented quotations and player-derived records", () => {
  const { editorial } = fixture();
  const citation = editorial.citations[0]!;
  expect(() => verifyCitation(citation, () => undefined)).toThrow(
    "source row does not exist",
  );
  expect(() =>
    verifyCitation(citation, () => ({ source: "players", text: citation.excerpt })),
  ).toThrow("not permitted");
  expect(() =>
    verifyCitation(citation, () => ({ source: "classicdb", text: "Different text" })),
  ).toThrow("not an exact substring");
});

it("verifies a structured name without pretending it is a prose quotation", () => {
  const citation = CitationSchema.parse({
    id: "area-dun-morogh",
    locator: { table: "name", kind: "area", id: 1, locale: "enUS" },
    excerpt: "Dun Morogh",
  });
  const result = verifyCitation(citation, () => ({
    source: "client",
    name: "Dun Morogh",
  }));
  expect(result.sourceId).toBe("client");
  expect(() =>
    verifyCitation(citation, () => ({ source: "client", name: 123 })),
  ).toThrow("expected a string");
});
