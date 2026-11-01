import { z } from "zod";

export const ERAS = [
  "warcraft",
  "vanilla",
  "tbc",
  "wrath",
  "cataclysm",
  "later",
] as const;
export const EraSchema = z.enum(ERAS);
export const IdentifierSchema = z.string().regex(/^[a-z][a-z0-9-]*$/);
const text = z.string().trim().min(1);
const digest = z.string().regex(/^[a-f0-9]{64}$/);

export const LocatorSchema = z.discriminatedUnion("table", [
  z.strictObject({
    table: z.literal("readable_page"),
    kind: z.enum(["object", "item"]),
    id: z.number().int().positive(),
    locale: z.literal("enUS"),
    idx: z.number().int().positive(),
  }),
  z.strictObject({
    table: z.literal("quest_text"),
    quest_id: z.number().int().positive(),
    locale: z.literal("enUS"),
    field: z.enum(["details", "objectives", "request", "reward", "end"]),
  }),
  z.strictObject({
    table: z.literal("name"),
    kind: z.enum([
      "area",
      "faction",
      "race",
      "spell",
      "spell_description",
      "faction_description",
      "item_description",
      "item",
    ]),
    id: z.number().int().positive(),
    locale: z.literal("enUS"),
  }),
]);

export const CitationSchema = z.strictObject({
  id: IdentifierSchema,
  locator: LocatorSchema,
  // A short exact substring, selected by the author, not an AI-made quotation.
  excerpt: text.max(700),
});

export const SourceSchema = z.strictObject({
  id: IdentifierSchema,
  version: text,
  url: z.url(),
  license: text,
});

export const EvidenceSchema = CitationSchema.extend({
  sourceId: IdentifierSchema,
  rowSha256: digest,
  excerptSha256: digest,
});

export const TextComponentSchema = z.strictObject({
  text: text
    .max(240)
    .refine((value) => !value.includes(";"), "No semicolons in clues/hints"),
  evidenceIds: z.array(IdentifierSchema).min(1),
});

export const EntrySchema = z.strictObject({
  id: IdentifierSchema,
  answer: z.strictObject({
    display: text.max(60),
    grid: z.string().regex(/^[A-Z]{3,30}$/),
    enumeration: z.array(z.number().int().positive()).min(1),
    kind: z.enum(["ordinary", "proper"]),
    familiarity: z.enum(["broad", "established", "specialist"]),
    rationale: text,
  }),
  fact: z.strictObject({ text, evidenceIds: z.array(IdentifierSchema).min(1) }),
  clue: TextComponentSchema,
  hint: TextComponentSchema,
  difficulty: z.enum(["easy", "medium", "hard"]),
  topics: z.array(IdentifierSchema).min(1),
  exposure: z.enum(["shared", "alliance", "horde"]),
  // Eligibility uses disclosure era, not the date an event supposedly occurred.
  disclosedBy: EraSchema,
  status: z.enum(["draft", "evidence-checked", "reviewed", "approved", "rejected"]),
  review: z.strictObject({
    evidenceReviewer: text,
    evidenceDigest: digest,
    contentDigest: digest.nullable(),
    coldReviewer: text.nullable(),
    notes: text,
  }),
});

export const EditorialSchema = z.strictObject({
  schemaVersion: z.literal(1),
  locale: z.literal("enUS"),
  cutoff: z.literal("wrath"),
  citations: z.array(CitationSchema).min(1),
  entries: z.array(EntrySchema).min(1),
});

export const SnapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  database: z.strictObject({ game: z.literal("classic"), sha256: digest }),
  sources: z.array(SourceSchema).min(1),
  evidence: z.array(EvidenceSchema).min(1),
});

export type Entry = z.infer<typeof EntrySchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type Locator = z.infer<typeof LocatorSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type Editorial = z.infer<typeof EditorialSchema>;
