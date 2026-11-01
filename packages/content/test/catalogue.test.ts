import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EditorialSchema,
  EntrySchema,
  LocatorSchema,
  SnapshotSchema,
  catalogueReport,
  entryContentDigest,
  entryEvidenceDigest,
  sha256,
  validateCatalogue,
} from "../src/index.ts";
import { fixture } from "./fixture.ts";

describe("content contracts", () => {
  it("accepts a fully linked research entry", () => {
    const { editorial, snapshot } = fixture();
    expect(validateCatalogue(editorial, snapshot)).toEqual([]);
  });

  it("rejects schema drift, invalid locators and empty evidence", () => {
    const { entry } = fixture();
    expect(EntrySchema.safeParse({ ...entry, invented: true }).success).toBe(false);
    expect(
      EntrySchema.safeParse({ ...entry, hint: { ...entry.hint, evidenceIds: [] } })
        .success,
    ).toBe(false);
    expect(
      EntrySchema.safeParse({ ...entry, clue: { ...entry.clue, text: "One; two" } })
        .success,
    ).toBe(false);
    expect(LocatorSchema.safeParse({ table: "players", id: 1 }).success).toBe(false);
    expect(
      LocatorSchema.safeParse({
        table: "quest_text",
        quest_id: 141,
        locale: "enUS",
        field: "details",
      }).success,
    ).toBe(true);
  });

  it.each([
    ["entry", "duplicate-id"],
    ["citation", "duplicate-id"],
    ["evidence", "duplicate-id"],
    ["source", "duplicate-id"],
  ])("rejects duplicate %s IDs", (kind, code) => {
    const { editorial, snapshot } = fixture();
    if (kind === "entry")
      editorial.entries.push(structuredClone(editorial.entries[0]!));
    if (kind === "citation")
      editorial.citations.push(structuredClone(editorial.citations[0]!));
    if (kind === "evidence")
      snapshot.evidence.push(structuredClone(snapshot.evidence[0]!));
    if (kind === "source") snapshot.sources.push(structuredClone(snapshot.sources[0]!));
    expect(
      validateCatalogue(editorial, snapshot).some((issue) => issue.code === code),
    ).toBe(true);
  });

  it("rejects post-Wrath facts even if the event happened in ancient history", () => {
    const { editorial, snapshot, entry } = fixture();
    entry.disclosedBy = "cataclysm";
    expect(
      validateCatalogue(editorial, snapshot).some(
        (issue) => issue.code === "era-cutoff",
      ),
    ).toBe(true);
  });

  it("detects invalid grid spelling and enumeration", () => {
    const { editorial, snapshot, entry } = fixture();
    entry.answer.grid = "MOTHER";
    entry.answer.enumeration = [3, 3];
    expect(validateCatalogue(editorial, snapshot).map((issue) => issue.code)).toContain(
      "normalization",
    );
    expect(validateCatalogue(editorial, snapshot).map((issue) => issue.code)).toContain(
      "enumeration",
    );
    entry.answer.display = "F4THER";
    expect(validateCatalogue(editorial, snapshot).map((issue) => issue.code)).toContain(
      "normalization",
    );
  });

  it("detects missing citations, orphan snapshots, missing sources and corrupt excerpts", () => {
    const { editorial, snapshot, entry } = fixture();
    editorial.citations = [];
    entry.hint.evidenceIds = ["missing"];
    snapshot.sources = [];
    snapshot.evidence[0]!.excerpt = "Modified source text.";
    const codes = validateCatalogue(editorial, snapshot).map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "orphan-evidence",
        "missing-source",
        "excerpt-integrity",
        "missing-evidence",
      ]),
    );
  });

  it("detects a citation changed without rechecking its source", () => {
    const { editorial, snapshot } = fixture();
    editorial.citations[0]!.excerpt = "A new quotation.";
    expect(validateCatalogue(editorial, snapshot).map((issue) => issue.code)).toContain(
      "stale-evidence",
    );
    snapshot.evidence = [];
    expect(validateCatalogue(editorial, snapshot).map((issue) => issue.code)).toContain(
      "missing-evidence",
    );
  });

  it("requires hint and clue evidence to be part of the reviewed fact", () => {
    const { editorial, snapshot, entry } = fixture();
    const citation = { ...editorial.citations[0]!, id: "extra-passage" };
    editorial.citations.push(citation);
    snapshot.evidence.push({ ...snapshot.evidence[0]!, id: citation.id });
    entry.hint.evidenceIds = [citation.id];
    expect(validateCatalogue(editorial, snapshot).map((issue) => issue.code)).toContain(
      "unreviewed-fact",
    );
  });

  it("rejects identical hints and explicit answer leaks", () => {
    const { editorial, snapshot, entry } = fixture();
    entry.hint.text = entry.clue.text.toUpperCase();
    expect(validateCatalogue(editorial, snapshot).map((issue) => issue.code)).toContain(
      "duplicate-hint",
    );
    entry.clue.text = "The answer is father.";
    expect(validateCatalogue(editorial, snapshot).map((issue) => issue.code)).toContain(
      "answer-leak",
    );
  });

  it("invalidates evidence review after a source revision", () => {
    const { editorial, snapshot } = fixture();
    snapshot.sources[0]!.version = "new-source-version";
    expect(validateCatalogue(editorial, snapshot).map((issue) => issue.code)).toContain(
      "stale-review",
    );
  });

  it("keeps source-review digests deterministic when references are reordered", () => {
    const { snapshot, entry } = fixture();
    const before = entryEvidenceDigest(entry, snapshot);
    entry.fact.evidenceIds.push(entry.fact.evidenceIds[0]!);
    expect(entryEvidenceDigest(entry, snapshot)).toBe(before);
  });

  it.each(["draft", "rejected"] as const)("does not treat %s as reviewed", (status) => {
    const { editorial, snapshot, entry } = fixture();
    entry.status = status;
    entry.review.evidenceDigest = sha256("not reviewed");
    expect(validateCatalogue(editorial, snapshot)).toEqual([]);
    expect(
      validateCatalogue(editorial, snapshot, "publication").map((issue) => issue.code),
    ).toContain("unapproved");
  });

  it("requires a current cold review for publication", () => {
    const { editorial, snapshot, entry } = fixture();
    expect(
      validateCatalogue(editorial, snapshot, "publication").map((issue) => issue.code),
    ).toContain("unapproved");
    entry.status = "approved";
    entry.review.coldReviewer = "another-review-pass";
    entry.review.contentDigest = entryContentDigest(entry);
    expect(validateCatalogue(editorial, snapshot, "publication")).toEqual([]);
    entry.hint.text = "An edited hint after review.";
    expect(
      validateCatalogue(editorial, snapshot, "publication").map((issue) => issue.code),
    ).toContain("stale-clue-review");
    entry.answer.familiarity = "specialist";
    expect(
      validateCatalogue(editorial, snapshot, "publication").map((issue) => issue.code),
    ).toContain("specialist-answer");
  });

  it("reports counts, repeated answers and publication eligibility honestly", () => {
    const { editorial, snapshot, entry } = fixture();
    const second = structuredClone(entry);
    second.id = "father-alternate";
    editorial.entries.push(second);
    const report = catalogueReport(editorial, snapshot);
    expect(report).toContain('"entries": 2');
    expect(report).toContain('"distinctGridAnswers": 1');
    expect(report).toContain('"publicationReadyEntries": 0');
    entry.status = "approved";
    entry.review.coldReviewer = "reviewer";
    entry.review.contentDigest = entryContentDigest(entry);
    expect(catalogueReport(editorial, snapshot)).toContain(
      '"publicationReadyEntries": 1',
    );
    snapshot.sources = [];
    expect(catalogueReport(editorial, snapshot)).toContain(
      '"publicationReadyEntries": 0',
    );
  });

  it("validates all 100 committed triads without private databases", () => {
    const editorial = EditorialSchema.parse(
      JSON.parse(
        readFileSync(
          new URL("../../../content/seed/editorial.json", import.meta.url),
          "utf8",
        ),
      ),
    );
    const snapshot = SnapshotSchema.parse(
      JSON.parse(
        readFileSync(
          new URL("../../../content/seed/evidence.json", import.meta.url),
          "utf8",
        ),
      ),
    );
    expect(editorial.entries).toHaveLength(100);
    expect(validateCatalogue(editorial, snapshot)).toEqual([]);
    expect(
      validateCatalogue(editorial, snapshot, "publication").filter(
        (issue) => issue.code === "unapproved",
      ),
    ).toHaveLength(100);
  });
});
