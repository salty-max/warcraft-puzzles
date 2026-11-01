import { createHash } from "node:crypto";
import { enumerateAnswer, normalizeAnswer } from "./normalize.ts";
import { ERAS } from "./schema.ts";
import type { Editorial, Entry, Snapshot } from "./schema.ts";

export type ValidationIssue = { entryId: string; code: string; message: string };

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Changing a source row or source version invalidates the old evidence review. */
export function entryEvidenceDigest(entry: Entry, snapshot: Snapshot): string {
  return sha256(
    JSON.stringify(
      [...new Set(entry.fact.evidenceIds)].sort().map((id) => {
        const item = snapshot.evidence.find((candidate) => candidate.id === id);
        const source = snapshot.sources.find(
          (candidate) => candidate.id === item?.sourceId,
        );
        return [id, item?.rowSha256, item?.excerptSha256, source?.version];
      }),
    ),
  );
}

export function entryContentDigest(entry: Entry): string {
  const { id, answer, fact, clue, hint, difficulty, topics, exposure, disclosedBy } =
    entry;
  return sha256(
    JSON.stringify({
      id,
      answer,
      fact,
      clue,
      hint,
      difficulty,
      topics,
      exposure,
      disclosedBy,
      evidenceDigest: entry.review.evidenceDigest,
    }),
  );
}

export function validateCatalogue(
  editorial: Editorial,
  snapshot: Snapshot,
  mode: "research" | "publication" = "research",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (entryId: string, code: string, message: string) => {
    issues.push({ entryId, code, message });
  };
  const evidence = new Map(snapshot.evidence.map((item) => [item.id, item]));
  const sources = new Map(snapshot.sources.map((item) => [item.id, item]));
  const citations = new Map(editorial.citations.map((item) => [item.id, item]));

  for (const [kind, ids] of [
    ["entry", editorial.entries.map((item) => item.id)],
    ["citation", editorial.citations.map((item) => item.id)],
    ["evidence", snapshot.evidence.map((item) => item.id)],
    ["source", snapshot.sources.map((item) => item.id)],
  ] as const) {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) add(id, "duplicate-id", `Duplicate ${kind} ID`);
      seen.add(id);
    }
  }

  for (const item of snapshot.evidence) {
    if (!sources.has(item.sourceId)) add(item.id, "missing-source", item.sourceId);
    const citation = citations.get(item.id);
    if (!citation) add(item.id, "orphan-evidence", "No matching author citation");
    else if (
      JSON.stringify(citation.locator) !== JSON.stringify(item.locator) ||
      citation.excerpt !== item.excerpt
    ) {
      add(item.id, "stale-evidence", "Citation changed since source verification");
    }
    if (sha256(item.excerpt) !== item.excerptSha256) {
      add(item.id, "excerpt-integrity", "Excerpt checksum does not match");
    }
  }
  for (const citation of editorial.citations) {
    if (!evidence.has(citation.id))
      add(citation.id, "missing-evidence", "Refresh evidence");
  }

  for (const entry of editorial.entries) {
    if (
      entry.status !== "draft" &&
      entry.status !== "rejected" &&
      entry.review.evidenceDigest !== entryEvidenceDigest(entry, snapshot)
    ) {
      add(entry.id, "stale-review", "Evidence changed since the recorded review");
    }
    try {
      if (normalizeAnswer(entry.answer.display) !== entry.answer.grid) {
        add(entry.id, "normalization", "Grid form differs from the display spelling");
      }
      if (
        JSON.stringify(enumerateAnswer(entry.answer.display)) !==
        JSON.stringify(entry.answer.enumeration)
      ) {
        add(entry.id, "enumeration", "Word lengths differ from the display spelling");
      }
    } catch {
      add(entry.id, "normalization", "Unsupported display spelling");
    }
    if (ERAS.indexOf(entry.disclosedBy) > ERAS.indexOf(editorial.cutoff)) {
      add(entry.id, "era-cutoff", "Fact was revealed after the Wrath cutoff");
    }
    const factIds = new Set(entry.fact.evidenceIds);
    for (const component of [entry.fact, entry.clue, entry.hint]) {
      for (const id of component.evidenceIds) {
        if (!evidence.has(id)) add(entry.id, "missing-evidence", id);
        else if (!factIds.has(id)) {
          add(
            entry.id,
            "unreviewed-fact",
            `Clue/hint evidence ${id} is absent from the fact`,
          );
        }
      }
    }
    if (entry.clue.text.toLowerCase() === entry.hint.text.toLowerCase()) {
      add(entry.id, "duplicate-hint", "Hint must add information beyond the clue");
    }
    const answerPattern = new RegExp(
      `\\b${entry.answer.display.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    );
    for (const [kind, component] of [
      ["clue", entry.clue],
      ["hint", entry.hint],
    ] as const) {
      if (answerPattern.test(component.text)) {
        add(entry.id, "answer-leak", `The ${kind} contains the full display answer`);
      }
    }
    if (mode === "publication") {
      if (entry.status !== "approved" || !entry.review.coldReviewer) {
        add(
          entry.id,
          "unapproved",
          "Publication requires approval and a cold reviewer",
        );
      }
      if (entry.answer.familiarity === "specialist") {
        add(
          entry.id,
          "specialist-answer",
          "Specialist answers need exclusion or rework",
        );
      }
      if (entry.review.contentDigest !== entryContentDigest(entry)) {
        add(
          entry.id,
          "stale-clue-review",
          "Clue, hint or answer changed since cold review",
        );
      }
    }
  }
  return issues;
}
