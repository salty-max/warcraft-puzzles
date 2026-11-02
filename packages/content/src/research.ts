import { z } from "zod";
import { enumerateAnswer, normalizeAnswer } from "./normalize.ts";
import { IdentifierSchema, LocatorSchema } from "./schema.ts";
import { sha256 } from "./validate.ts";

// The answer comes from wow-data by id. The clue and hint come from lore research:
// a dossier per answer, each fact with its sources and the date it was first disclosed.

/**
 * Lore disclosed before Cataclysm counts. The cutoff is patch 4.0.1 (12 October 2010),
 * the first of Cataclysm's pre-patches, not the box's release: the pre-patches and the
 * tie-in novel came earlier and are Cataclysm all the same.
 */
export const DISCLOSURE_CUTOFF = "2010-10-12";
/** Sources that never count, whatever date a fact gives them. */
export const EXCLUDED_SOURCES =
  /chronicle|wowcv|shattering|cataclysm|wolfheart|hearthstone|\brpg\b|role ?playing|patch 4\.|\b4\.0\.\d/i;
/** warcraft.wiki.gg is checked by the tool. The other domains are read by the fact-checker. */
export const WIKI_HOST = "warcraft.wiki.gg";
export const MANUAL_HOSTS = [
  "worldofwarcraft.blizzard.com",
  "news.blizzard.com",
  "blizzard.com",
  "web.archive.org",
] as const;
export const PASSAGE_MAX_WORDS = 25;
export const SHARED_RUN_WORDS = 4;

const text = z.string().trim().min(1);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const date = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/);

export const EntityKinds = [
  "creature",
  "object",
  "item",
  "area",
  "faction",
  "spell",
  "race",
] as const;

export const EntitySchema = z.strictObject({
  db: z.enum(["classic", "forever"]),
  kind: z.enum(EntityKinds),
  id: z.number().int().positive(),
  // exact: the name is the answer. part: the answer is a run of whole words in the name
  // (FEL in "Fel Steed", BOLVAR FORDRAGON in "Highlord Bolvar Fordragon").
  match: z.enum(["exact", "part"]).default("exact"),
});

export const WebSourceSchema = z.strictObject({
  url: z.url(),
  revid: z.number().int().positive().optional(),
  passage: text,
  cites: text.optional(),
  accessed: date,
  // A source the tool can't fetch (Blizzard pages, the Wayback Machine): the fact-checker
  // reads it and says so in its verdict.
  manual: z.literal(true).optional(),
});

export const GameSourceSchema = z.strictObject({
  game: z.strictObject({ db: z.enum(["classic", "forever"]), locator: LocatorSchema }),
  passage: text,
});

export const ResearchSourceSchema = z.union([WebSourceSchema, GameSourceSchema]);

export const FactSchema = z.strictObject({
  id: IdentifierSchema,
  kind: z.enum(["lore", "game", "spelling", "inference"]).default("lore"),
  says: text.refine((value) => !value.includes(";"), "No semicolons"),
  sources: z.array(ResearchSourceSchema).default([]),
  from: z.array(IdentifierSchema).optional(),
  established: z
    .strictObject({ by: text, date, era: z.enum(["vanilla", "tbc", "wrath"]) })
    .optional(),
});

export const DossierSchema = z.strictObject({
  answer: text.max(60),
  entity: EntitySchema,
  scope: text.optional(),
  notes: text.optional(),
  facts: z.array(FactSchema).min(1),
  dropped: z.array(z.strictObject({ says: text, why: text })).default([]),
});

const PromptSchema = z.strictObject({
  text: text.max(240).refine((value) => !value.includes(";"), "No semicolons"),
  facts: z.array(IdentifierSchema).min(1),
});

export const TriadSchema = z.strictObject({
  id: IdentifierSchema,
  answer: text.max(60),
  clue: PromptSchema,
  hint: PromptSchema,
  difficulty: z.enum(["easy", "medium", "hard"]),
  status: z.enum(["draft", "evidence-checked", "reviewed", "approved", "rejected"]),
  // The live editorial entry an approved triad would replace.
  replaces: IdentifierSchema.optional(),
  gates: z
    .strictObject({
      factCheck: text.optional(),
      coldSolve: z.strictObject({ answer: text, solved: z.boolean() }).optional(),
      editor: text.optional(),
    })
    .optional(),
  // The digest of the wording and the facts it stands on when the gates passed.
  // Changing either invalidates the review (the project's rule).
  reviewDigest: digest.optional(),
});

export const ResearchSchema = z.strictObject({
  schemaVersion: z.literal(1),
  batch: IdentifierSchema,
  attribution: text,
  dossiers: z.array(DossierSchema).min(1),
  triads: z.array(TriadSchema).default([]),
});

/** What the verifier proved against the network and the databases, replayed offline. */
export const ResearchSnapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  databases: z.strictObject({ classic: digest, forever: digest }),
  entities: z.array(
    z.strictObject({
      db: z.enum(["classic", "forever"]),
      kind: z.enum(EntityKinds),
      id: z.number().int().positive(),
      name: text,
      inClassic: z.boolean(),
    }),
  ),
  sources: z.array(
    z.strictObject({ key: text, passageSha256: digest, contentSha256: digest }),
  ),
});

export type Entity = z.infer<typeof EntitySchema>;
export type WebSource = z.infer<typeof WebSourceSchema>;
export type GameSource = z.infer<typeof GameSourceSchema>;
export type Fact = z.infer<typeof FactSchema>;
export type Dossier = z.infer<typeof DossierSchema>;
export type Triad = z.infer<typeof TriadSchema>;
export type Research = z.infer<typeof ResearchSchema>;
export type ResearchSnapshot = z.infer<typeof ResearchSnapshotSchema>;
export type ResearchIssue = { id: string; code: string; message: string };

export function isWebSource(source: WebSource | GameSource): source is WebSource {
  return "url" in source;
}

/** One key per passage, the same offline and in the verifier. */
export function sourceKey(source: WebSource | GameSource): string {
  const passage = sha256(normalizeText(source.passage)).slice(0, 16);
  if (isWebSource(source))
    return `${source.url}@${source.revid ?? "manual"}#${passage}`;
  return `game:${source.game.db}:${JSON.stringify(source.game.locator)}#${passage}`;
}

/** Binds a triad's wording to the facts and passages it stands on. */
export function triadDigest(triad: Triad, dossier: Dossier): string {
  // An inference's premises count as used: changing one changes what it proves.
  const used = new Set<string>();
  const queue = [...triad.clue.facts, ...triad.hint.facts];
  while (queue.length) {
    const id = queue.pop()!;
    if (used.has(id)) continue;
    used.add(id);
    queue.push(...(dossier.facts.find((fact) => fact.id === id)?.from ?? []));
  }
  const facts = dossier.facts
    .filter((fact) => used.has(fact.id))
    .map((fact) => [fact.id, fact.says, fact.sources.map(sourceKey), fact.established]);
  return sha256(
    JSON.stringify({
      answer: triad.answer,
      clue: triad.clue,
      hint: triad.hint,
      difficulty: triad.difficulty,
      facts,
    }),
  );
}

export function entityKey(entity: Pick<Entity, "db" | "kind" | "id">): string {
  return `${entity.db}:${entity.kind}:${entity.id}`;
}

/** Quotes, dashes and spacing differ between the wiki's source and its pages. */
export function normalizeText(value: string): string {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function words(value: string): string[] {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(" ")
    .map((word) => word.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

/** Every maximal run of at least `min` consecutive words two texts share. */
export function sharedRuns(a: string, b: string, min: number): string[][] {
  const left = words(a);
  const right = words(b);
  const runs: string[][] = [];
  for (let i = 0; i < left.length; i++) {
    for (let j = 0; j < right.length; j++) {
      if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) continue;
      let length = 0;
      while (
        i + length < left.length &&
        j + length < right.length &&
        left[i + length] === right[j + length]
      ) {
        length++;
      }
      if (length >= min) runs.push(left.slice(i, i + length));
    }
  }
  return runs;
}

/** The longest run of consecutive words two texts share. */
export function longestSharedRun(a: string, b: string): string[] {
  const left = words(a);
  const right = words(b);
  let best: string[] = [];
  for (let i = 0; i < left.length; i++) {
    for (let j = 0; j < right.length; j++) {
      let length = 0;
      while (
        i + length < left.length &&
        j + length < right.length &&
        left[i + length] === right[j + length]
      ) {
        length++;
      }
      if (length > best.length) best = left.slice(i, i + length);
    }
  }
  return best;
}

/** Does the answer appear as whole words of a game name? */
export function answerMatchesName(
  answer: string,
  name: string,
  match: Entity["match"],
): boolean {
  const grid = normalizeAnswer(answer);
  if (match === "exact") {
    try {
      return normalizeAnswer(name) === grid;
    } catch {
      return false;
    }
  }
  const parts = name.split(/[^A-Za-z'’-]+/).filter(Boolean);
  for (let start = 0; start < parts.length; start++) {
    let joined = "";
    for (let end = start; end < parts.length; end++) {
      joined += parts[end]!.replace(/['’-]/g, "").toUpperCase();
      if (joined === grid) return true;
      if (joined.length >= grid.length) break;
    }
  }
  return false;
}

/** The words a text capitalises, lower-cased: names, and sometimes a sentence's first word. */
function capitalised(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(" ")
      .filter((token) => /^["'(]?[A-Z]/.test(token))
      .flatMap((token) => words(token)),
  );
}

/**
 * How many of a shared run's words are the writer's own, not a name. "At the Molten Core"
 * shares two, "led the surviving gnomes out of" six. A word counts as a name only when
 * both texts capitalise it, so a clue's first word is not a name for being first.
 */
function ownWords(prompt: string, passage: string, run: string[]): number {
  const inPrompt = capitalised(prompt);
  const inPassage = capitalised(passage);
  return run.filter((word) => !(inPrompt.has(word) && inPassage.has(word))).length;
}

function beforeCutoff(value: string): boolean | undefined {
  if (value.length === 4) {
    if (value < DISCLOSURE_CUTOFF.slice(0, 4)) return true;
    if (value > DISCLOSURE_CUTOFF.slice(0, 4)) return false;
    return undefined;
  }
  const padded = value.length === 7 ? `${value}-01` : value;
  if (value.length === 7 && value === DISCLOSURE_CUTOFF.slice(0, 7)) return undefined;
  return padded < DISCLOSURE_CUTOFF;
}

const LETTER_COUNT = /\b\d+\s*-?\s*letters?\b|\(\s*\d+(\s*,\s*\d+)*\s*\)/i;

export type LiveAnswer = { id: string; display: string };

/**
 * The offline checks. `notes` are reported, not errors: a clue naming another banked
 * answer is allowed (the owner's choice, 2 November 2026), the twin rule keeps the two
 * apart in a grid.
 */
export function validateResearch(
  research: Research,
  snapshot: ResearchSnapshot | undefined,
  live: LiveAnswer[] = [],
): { issues: ResearchIssue[]; notes: ResearchIssue[] } {
  const issues: ResearchIssue[] = [];
  const notes: ResearchIssue[] = [];
  const add = (id: string, code: string, message: string) =>
    issues.push({ id, code, message });
  const snapshotSources = new Map(snapshot?.sources.map((item) => [item.key, item]));
  const snapshotEntities = new Map(
    snapshot?.entities.map((item) => [entityKey(item), item]),
  );
  const dossiers = new Map<string, Dossier>();

  for (const dossier of research.dossiers) {
    let grid: string;
    try {
      grid = normalizeAnswer(dossier.answer);
    } catch {
      add(dossier.answer, "normalization", "Unsupported answer spelling");
      continue;
    }
    if (dossiers.has(grid)) add(grid, "duplicate-dossier", "One dossier per answer");
    dossiers.set(grid, dossier);

    const entity = snapshotEntities.get(entityKey(dossier.entity));
    if (!entity) add(grid, "unverified-entity", "Run the research verifier");
    else {
      if (!answerMatchesName(dossier.answer, entity.name, dossier.entity.match)) {
        add(grid, "entity-name", `The game names it ${JSON.stringify(entity.name)}`);
      }
      if (!entity.inClassic && !dossier.scope) {
        add(grid, "forever-scope", "A Forever-only answer needs a scope line");
      }
    }

    const factIds = new Set<string>();
    for (const fact of dossier.facts) {
      const id = `${grid}/${fact.id}`;
      if (factIds.has(fact.id)) add(id, "duplicate-fact", "Duplicate fact id");
      factIds.add(fact.id);
      if (fact.kind === "spelling") {
        if (fact.sources.length)
          add(id, "spelling-source", "A spelling cue cites nothing");
        continue;
      }
      if (fact.kind === "inference") {
        if (!fact.from?.length) add(id, "inference-premises", "Name the premises");
        for (const premise of fact.from ?? []) {
          if (!dossier.facts.some((other) => other.id === premise && other !== fact)) {
            add(id, "inference-premises", `Unknown premise ${premise}`);
          }
        }
        continue;
      }
      if (!fact.sources.length) add(id, "no-source", "A fact needs a source");
      if (!fact.established) add(id, "no-date", "When was this first disclosed?");
      else {
        const before = beforeCutoff(fact.established.date);
        if (before === undefined) {
          add(id, "ambiguous-date", "Give the day: the cutoff is 12 October 2010");
        } else if (!before) {
          add(id, "after-cutoff", `${fact.established.by} came after Wrath`);
        }
        const cited = fact.sources.map((source) =>
          isWebSource(source) ? (source.cites ?? "") : "",
        );
        const excluded = [fact.established.by, ...cited].find((name) =>
          EXCLUDED_SOURCES.test(name),
        );
        if (excluded) add(id, "excluded-source", `${excluded} never counts`);
      }
      if (
        fact.kind === "game" &&
        !fact.sources.some((source) => !isWebSource(source))
      ) {
        add(id, "game-source", "A game fact cites a wow-data row");
      }
      for (const source of fact.sources) {
        if (words(source.passage).length >= PASSAGE_MAX_WORDS) {
          add(id, "long-passage", `Keep passages under ${PASSAGE_MAX_WORDS} words`);
        }
        if (isWebSource(source)) {
          const host = new URL(source.url).hostname;
          const manualHost = (MANUAL_HOSTS as readonly string[]).includes(host);
          if (host !== WIKI_HOST && !manualHost) {
            add(id, "source-domain", `${host} is not an allowed source`);
            continue;
          }
          if (host === WIKI_HOST && source.manual) {
            add(id, "source-manual", "The wiki is checked by the tool");
          }
          if (host === WIKI_HOST && !source.revid) {
            add(id, "source-revid", "Pin the wiki revision");
          }
          if (manualHost && !source.manual) {
            add(
              id,
              "source-manual",
              `${host} is read by the fact-checker: mark it manual`,
            );
          }
          if (source.manual) continue;
        }
        const recorded = snapshotSources.get(sourceKey(source));
        if (
          !recorded ||
          recorded.passageSha256 !== sha256(normalizeText(source.passage))
        ) {
          add(id, "unverified-source", "Run the research verifier");
        }
      }
    }
  }

  const liveOthers = live.map((item) => ({
    ...item,
    pattern: new RegExp(
      `(^|[^A-Za-z])${item.display.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^A-Za-z])`,
      "i",
    ),
  }));
  const triadIds = new Set<string>();
  for (const triad of research.triads) {
    if (triadIds.has(triad.id)) add(triad.id, "duplicate-id", "Duplicate triad id");
    triadIds.add(triad.id);
    let grid: string;
    try {
      grid = normalizeAnswer(triad.answer);
      enumerateAnswer(triad.answer);
    } catch {
      add(triad.id, "normalization", "Unsupported answer spelling");
      continue;
    }
    const dossier = dossiers.get(grid);
    if (!dossier) {
      add(triad.id, "no-dossier", "Every triad stands on a dossier");
      continue;
    }
    if (triad.status === "approved" || triad.status === "reviewed") {
      const gates = triad.gates;
      if (!gates?.factCheck || !gates.coldSolve || !gates.editor) {
        add(triad.id, "ungated", `A ${triad.status} triad needs all three gates`);
      }
      if (triad.reviewDigest !== triadDigest(triad, dossier)) {
        add(triad.id, "stale-review", "Wording or facts changed since the review");
      }
    }
    if (triad.clue.text.toLowerCase() === triad.hint.text.toLowerCase()) {
      add(triad.id, "duplicate-hint", "The hint must add a route");
    }
    const passages = dossier.facts.flatMap((fact) => [
      fact.says,
      ...fact.sources.map((source) => source.passage),
    ]);
    for (const [part, prompt] of [
      ["clue", triad.clue],
      ["hint", triad.hint],
    ] as const) {
      for (const factId of prompt.facts) {
        const fact = dossier.facts.find((item) => item.id === factId);
        if (!fact)
          add(triad.id, "unknown-fact", `${part}: ${factId} is not in the dossier`);
        else if (part === "clue" && fact.kind === "spelling") {
          add(triad.id, "spelling-clue", "Spelling cues belong in hints");
        }
      }
      if (LETTER_COUNT.test(prompt.text)) {
        add(triad.id, "letter-count", `The ${part} gives a letter count`);
      }
      const leak = new RegExp(
        `(^|[^A-Za-z])(${dossier.answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${grid})($|[^A-Za-z])`,
        "i",
      );
      if (leak.test(prompt.text)) {
        add(triad.id, "answer-leak", `The ${part} contains the answer`);
      }
      for (const passage of passages) {
        const run = sharedRuns(prompt.text, passage, SHARED_RUN_WORDS).find(
          (shared) => ownWords(prompt.text, passage, shared) >= SHARED_RUN_WORDS,
        );
        if (run) {
          add(
            triad.id,
            "echoes-source",
            `The ${part} shares "${run.join(" ")}" with its research. Use your own words`,
          );
          break;
        }
      }
      for (const other of liveOthers) {
        if (normalizeAnswer(other.display) === grid) continue;
        if (other.pattern.test(prompt.text)) {
          notes.push({
            id: triad.id,
            code: "names-answer",
            message: `The ${part} names ${other.display} (${other.id})`,
          });
        }
      }
    }
  }
  return { issues, notes };
}
