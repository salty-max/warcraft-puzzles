import {
  EditorialSchema,
  SnapshotSchema,
  entryEvidenceDigest,
  sha256,
} from "../src/index.ts";

export function fixture() {
  const citation = {
    id: "test-passage",
    locator: { table: "readable_page", kind: "object", id: 1, locale: "enUS", idx: 1 },
    excerpt: "A father has a child.",
  };
  const snapshot = SnapshotSchema.parse({
    schemaVersion: 1,
    database: { game: "classic", sha256: sha256("synthetic fixture") },
    sources: [
      {
        id: "classicdb",
        version: "test-version",
        url: "https://example.com",
        license: "synthetic",
      },
    ],
    evidence: [
      {
        ...citation,
        sourceId: "classicdb",
        rowSha256: sha256("source row"),
        excerptSha256: sha256(citation.excerpt),
      },
    ],
  });
  const editorial = EditorialSchema.parse({
    schemaVersion: 1,
    locale: "enUS",
    cutoff: "wrath",
    citations: [citation],
    entries: [
      {
        id: "father",
        answer: {
          display: "FATHER",
          grid: "FATHER",
          enumeration: [6],
          kind: "ordinary",
          familiarity: "broad",
          rationale: "A familiar relationship word.",
        },
        fact: { text: "A parent can have a child.", evidenceIds: ["test-passage"] },
        clue: {
          text: "A male parent's relationship to his child",
          evidenceIds: ["test-passage"],
        },
        hint: { text: "Think of the older generation.", evidenceIds: ["test-passage"] },
        difficulty: "easy",
        topics: ["family"],
        exposure: "shared",
        disclosedBy: "vanilla",
        status: "evidence-checked",
        review: {
          evidenceReviewer: "test-reviewer",
          evidenceDigest: sha256("not yet recorded"),
          contentDigest: null,
          coldReviewer: null,
          notes: "Synthetic test data, not a Warcraft source.",
        },
      },
    ],
  });
  const entry = editorial.entries[0]!;
  entry.review.evidenceDigest = entryEvidenceDigest(entry, snapshot);
  return { editorial, snapshot, entry };
}
