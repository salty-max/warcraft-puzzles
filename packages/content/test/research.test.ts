import { describe, expect, it } from "vitest";
import {
  answerMatchesName,
  entityKey,
  longestSharedRun,
  normalizeText,
  ResearchSchema,
  sha256,
  sourceKey,
  validateResearch,
} from "../src/index.ts";
import type { Research, ResearchSnapshot } from "../src/index.ts";
import { sharedRuns, triadDigest } from "../src/index.ts";

const wiki = "https://warcraft.wiki.gg/wiki/Edwin_VanCleef";
const nethergarde = "He also led the construction of Nethergarde Keep";

function research(overrides: (draft: Record<string, unknown>) => void = () => {}) {
  const draft = {
    schemaVersion: 1,
    batch: "test",
    attribution: "Passages from warcraft.wiki.gg, CC BY-SA 4.0.",
    dossiers: [
      {
        answer: "Edwin VanCleef",
        entity: { db: "classic", kind: "creature", id: 639 },
        facts: [
          {
            id: "nethergarde",
            says: "He led the building of Nethergarde Keep",
            sources: [
              { url: wiki, revid: 1, passage: nethergarde, accessed: "2026-11-02" },
            ],
            established: {
              by: "Beyond the Dark Portal",
              date: "2008-06-24",
              era: "wrath",
            },
          },
          {
            id: "letter",
            kind: "game",
            says: "A friend thought him an idealist",
            sources: [
              {
                game: {
                  db: "classic",
                  locator: {
                    table: "readable_page",
                    kind: "item",
                    id: 2874,
                    locale: "enUS",
                    idx: 1,
                  },
                },
                passage: "an idealist",
              },
            ],
            established: { by: "An Unsent Letter", date: "2004", era: "vanilla" },
          },
          { id: "name", kind: "spelling", says: "A clean cleft in the surname" },
          {
            id: "both",
            kind: "inference",
            says: "A builder turned outlaw",
            from: ["nethergarde", "letter"],
          },
        ],
      },
    ],
    triads: [
      {
        id: "vancleef-lore",
        answer: "Edwin VanCleef",
        clue: {
          text: "Master mason who raised a keep to watch the Dark Portal",
          facts: ["nethergarde"],
        },
        hint: {
          text: "A letter never sent remembers him fondly in Stormwind",
          facts: ["letter", "name"],
        },
        difficulty: "medium",
        status: "draft",
      },
    ],
  };
  overrides(draft);
  return ResearchSchema.parse(draft);
}

function snapshotFor(
  item: Research,
  name = "Edwin VanCleef",
  inClassic = true,
): ResearchSnapshot {
  const sources = item.dossiers.flatMap((dossier) =>
    dossier.facts.flatMap((fact) =>
      fact.sources.map((source) => ({
        key: sourceKey(source),
        passageSha256: sha256(normalizeText(source.passage)),
        contentSha256: sha256("content"),
      })),
    ),
  );
  return {
    schemaVersion: 1,
    databases: { classic: sha256("c"), forever: sha256("f") },
    entities: item.dossiers.map((dossier) => ({ ...dossier.entity, name, inClassic })),
    sources,
  };
}

const codes = (item: Research, snapshot?: ResearchSnapshot, live = []) =>
  validateResearch(item, snapshot, live).issues.map((issue) => issue.code);

describe("research dossiers", () => {
  it("accepts a sourced, dated, verified dossier and its triad", () => {
    const item = research();
    expect(validateResearch(item, snapshotFor(item))).toEqual({
      issues: [],
      notes: [],
    });
  });

  it("asks for the verifier when the snapshot lacks a source or the answer", () => {
    const item = research();
    expect(codes(item, undefined)).toEqual(
      expect.arrayContaining(["unverified-entity", "unverified-source"]),
    );
    const moved = research((draft) => {
      const dossier = (
        draft.dossiers as { facts: { sources: { passage: string }[] }[] }[]
      )[0]!;
      dossier.facts[0]!.sources[0]!.passage = "He also led the construction";
    });
    expect(codes(moved, snapshotFor(item))).toContain("unverified-source");
  });

  it("checks the answer against the game's name and Forever's scope", () => {
    const item = research();
    expect(codes(item, snapshotFor(item, "Edwin van Cleef the Younger"))).toContain(
      "entity-name",
    );
    expect(codes(item, snapshotFor(item, "Edwin VanCleef", false))).toContain(
      "forever-scope",
    );
    const scoped = research((draft) => {
      (draft.dossiers as { scope?: string }[])[0]!.scope =
        "Forever-only, checked: not Season of Discovery";
    });
    expect(codes(scoped, snapshotFor(scoped, "Edwin VanCleef", false))).toEqual([]);
  });

  it("dates every fact by disclosure, before Cataclysm", () => {
    const at = (date: string) =>
      research((draft) => {
        const facts = (
          draft.dossiers as { facts: { established?: { date: string } }[] }[]
        )[0]!.facts;
        facts[0]!.established!.date = date;
      });
    const ok = at("2010-10-11");
    expect(codes(ok, snapshotFor(ok))).toEqual([]);
    for (const late of ["2016", "2010-10-12", "2011-01"]) {
      const item = at(late);
      expect(codes(item, snapshotFor(item))).toContain("after-cutoff");
    }
    for (const unclear of ["2010", "2010-10"]) {
      const item = at(unclear);
      expect(codes(item, snapshotFor(item))).toContain("ambiguous-date");
    }
    const early = at("2010-09");
    expect(codes(early, snapshotFor(early))).toEqual([]);
  });

  it("refuses unsourced, undated and malformed facts", () => {
    const item = research((draft) => {
      const facts = (draft.dossiers as { facts: Record<string, unknown>[] }[])[0]!
        .facts;
      facts.push({ id: "bare", says: "Something nobody wrote down" });
      facts.push({
        id: "bare",
        says: "A twin id",
        sources: [],
        established: undefined,
      });
      facts.push({ id: "loose", kind: "inference", says: "Out of thin air" });
      facts.push({
        id: "wrong",
        kind: "inference",
        says: "Bad premise",
        from: ["nowhere"],
      });
      facts.push({
        id: "cued",
        kind: "spelling",
        says: "A cue with a source",
        sources: [{ url: wiki, revid: 1, passage: "x", accessed: "2026-11-02" }],
      });
      facts.push({
        id: "gameless",
        kind: "game",
        says: "A game fact from the wiki",
        sources: [
          { url: wiki, revid: 1, passage: nethergarde, accessed: "2026-11-02" },
        ],
        established: { by: "x", date: "2004", era: "vanilla" },
      });
    });
    expect(codes(item, snapshotFor(item))).toEqual(
      expect.arrayContaining([
        "no-source",
        "no-date",
        "duplicate-fact",
        "inference-premises",
        "spelling-source",
        "game-source",
      ]),
    );
  });

  it("keeps sources to the allowed hosts, pinned and short", () => {
    const withSource = (source: Record<string, unknown>) =>
      research((draft) => {
        const facts = (draft.dossiers as { facts: { sources: unknown[] }[] }[])[0]!
          .facts;
        facts[0]!.sources = [
          { accessed: "2026-11-02", passage: "a short passage", ...source },
        ];
      });
    const run = (source: Record<string, unknown>) => {
      const item = withSource(source);
      return codes(item, snapshotFor(item));
    };
    expect(run({ url: "https://www.wowhead.com/npc=639" })).toContain("source-domain");
    expect(run({ url: wiki })).toContain("source-revid");
    expect(run({ url: wiki, revid: 1, manual: true })).toContain("source-manual");
    expect(run({ url: "https://worldofwarcraft.blizzard.com/story" })).toContain(
      "source-manual",
    );
    expect(
      run({ url: "https://worldofwarcraft.blizzard.com/story", manual: true }),
    ).toEqual([]);
    expect(run({ url: wiki, revid: 1, passage: "word ".repeat(30) })).toContain(
      "long-passage",
    );
  });

  it("holds triads to their dossier and the house rules", () => {
    const item = research((draft) => {
      const triads = draft.triads as Record<string, unknown>[];
      const base = triads[0]!;
      triads.push(
        { ...base, id: "vancleef-lore" },
        { ...base, id: "orphan", answer: "Hogger" },
        { ...base, id: "bad-spelling", answer: "Bad!" },
        {
          ...base,
          id: "rules",
          clue: { text: "Edwin VanCleef, 5 letters", facts: ["name", "ghost"] },
          hint: { text: "Edwin VanCleef, 5 letters", facts: ["letter"] },
        },
        {
          ...base,
          id: "echo",
          clue: {
            text: "He led the construction of Nethergarde Keep (5,8)",
            facts: ["nethergarde"],
          },
        },
      );
    });
    expect(codes(item, snapshotFor(item))).toEqual(
      expect.arrayContaining([
        "duplicate-id",
        "no-dossier",
        "normalization",
        "unknown-fact",
        "spelling-clue",
        "letter-count",
        "answer-leak",
        "duplicate-hint",
        "echoes-source",
      ]),
    );
  });

  it("reports, without refusing, a clue that names another banked answer", () => {
    const item = research();
    const result = validateResearch(item, snapshotFor(item), [
      { id: "stormwind", display: "Stormwind" },
      { id: "dark-portal", display: "Dark Portal" },
      { id: "vancleef", display: "Edwin VanCleef" },
      { id: "orc", display: "Orc" },
    ]);
    expect(result.issues).toEqual([]);
    expect(result.notes.map((note) => note.message)).toEqual([
      "The clue names Dark Portal (dark-portal)",
      "The hint names Stormwind (stormwind)",
    ]);
  });

  it("refuses a duplicate dossier and an unsupported answer", () => {
    const item = research((draft) => {
      const dossiers = draft.dossiers as Record<string, unknown>[];
      dossiers.push({ ...dossiers[0]! }, { ...dossiers[0]!, answer: "Bad!" });
    });
    expect(codes(item, snapshotFor(item))).toEqual(
      expect.arrayContaining(["duplicate-dossier", "normalization"]),
    );
  });
});

describe("research helpers", () => {
  it("matches an answer to a game name, whole or as a run of words", () => {
    expect(answerMatchesName("Edwin VanCleef", "Edwin VanCleef", "exact")).toBe(true);
    expect(answerMatchesName("Fel", "Fel Steed", "exact")).toBe(false);
    expect(answerMatchesName("Fel", "Fel Steed", "part")).toBe(true);
    expect(answerMatchesName("Fel", "Felhound", "part")).toBe(false);
    expect(
      answerMatchesName("Bolvar Fordragon", "Highlord Bolvar Fordragon", "part"),
    ).toBe(true);
    expect(answerMatchesName("Orc", "Orc, Blackrock", "part")).toBe(true);
    expect(answerMatchesName("Orc", "Orc!", "exact")).toBe(false);
  });

  it("finds the longest run of shared words", () => {
    expect(longestSharedRun("The quick brown fox", "a QUICK brown fox jumps")).toEqual([
      "quick",
      "brown",
      "fox",
    ]);
    expect(longestSharedRun("nothing", "else")).toEqual([]);
  });

  it("normalises quotes and keys sources and entities stably", () => {
    expect(normalizeText("‘a’ “b” —  c")).toBe("'a' \"b\" - c");
    expect(entityKey({ db: "classic", kind: "item", id: 785 })).toBe(
      "classic:item:785",
    );
    expect(
      sourceKey({ url: wiki, passage: "x", accessed: "2026", manual: true }),
    ).toMatch(new RegExp(`^${wiki}@manual#[a-f0-9]{16}$`));
  });
});

describe("research reviews and edge cases", () => {
  it("keeps two passages from one revision apart", () => {
    const item = research((draft) => {
      const facts = (draft.dossiers as { facts: { sources: unknown[] }[] }[])[0]!.facts;
      facts[0]!.sources.push({
        url: wiki,
        revid: 1,
        passage: "Nethergarde Keep",
        accessed: "2026-11-02",
      });
    });
    const snapshot = snapshotFor(item);
    expect(new Set(snapshot.sources.map((source) => source.key)).size).toBe(3);
    expect(codes(item, snapshot)).toEqual([]);
  });

  it("refuses sources that never count, whatever their date", () => {
    const item = research((draft) => {
      const facts = (
        draft.dossiers as { facts: { established?: { by: string; date: string } }[] }[]
      )[0]!.facts;
      facts[0]!.established = { by: "The Shattering", date: "2010-08-31" };
      (facts[0]!.established as Record<string, string>).era = "wrath";
    });
    expect(codes(item, snapshotFor(item))).toContain("excluded-source");
  });

  it("allows a passage of 24 words and refuses one of 25", () => {
    const withWords = (n: number) =>
      research((draft) => {
        const facts = (
          draft.dossiers as { facts: { sources: { passage: string }[] }[] }[]
        )[0]!.facts;
        facts[0]!.sources[0]!.passage = Array.from(
          { length: n },
          (_, i) => `w${i}`,
        ).join(" ");
      });
    const short = withWords(24);
    expect(codes(short, snapshotFor(short))).toEqual([]);
    const long = withWords(25);
    expect(codes(long, snapshotFor(long))).toContain("long-passage");
  });

  it("lets a proper name through the echo guard, not a reworded sentence", () => {
    const item = research((draft) => {
      const dossier = (draft.dossiers as { facts: { says: string }[] }[])[0]!;
      dossier.facts[0]!.says = "He fought the Cult of the Damned for years";
      const triad = (draft.triads as { clue: { text: string } }[])[0]!;
      triad.clue.text = "Mason who hunted the Cult of the Damned";
    });
    expect(codes(item, snapshotFor(item))).toEqual([]);
    const located = research((draft) => {
      const dossier = (draft.dossiers as { facts: { says: string }[] }[])[0]!;
      dossier.facts[0]!.says = "He was summoned at the Molten Core by a king";
      const triad = (draft.triads as { clue: { text: string } }[])[0]!;
      triad.clue.text = "Mason later seen at the Molten Core";
    });
    expect(codes(located, snapshotFor(located))).toEqual([]);
  });

  it("binds an approval to the gates and the wording", () => {
    const approved = (edit: (triad: Record<string, unknown>) => void = () => {}) =>
      research((draft) => {
        const triad = (draft.triads as Record<string, unknown>[])[0]!;
        triad.status = "approved";
        triad.gates = {
          factCheck: "clean",
          coldSolve: { answer: "VANCLEEF", solved: true },
          editor: "keep",
        };
        edit(triad);
      });
    const base = approved();
    const digest = triadDigest(base.triads[0]!, base.dossiers[0]!);
    const signed = approved((triad) => (triad.reviewDigest = digest));
    expect(codes(signed, snapshotFor(signed))).toEqual([]);
    expect(codes(base, snapshotFor(base))).toContain("stale-review");
    const edited = approved((triad) => {
      triad.reviewDigest = digest;
      (triad.clue as { text: string }).text = "Mason who raised a keep by the Portal";
    });
    expect(codes(edited, snapshotFor(edited))).toContain("stale-review");
    const ungated = approved((triad) => {
      triad.reviewDigest = digest;
      triad.gates = { factCheck: "clean" };
    });
    expect(codes(ungated, snapshotFor(ungated))).toContain("ungated");
  });
});

describe("research guards, second pass", () => {
  it("still catches a copied phrase beside an exempt proper name", () => {
    const item = research((draft) => {
      const dossier = (draft.dossiers as { facts: { says: string }[] }[])[0]!;
      dossier.facts[0]!.says =
        "The Knights of the Ebon Blade broke away from the Scourge at Light's Hope";
      const triad = (draft.triads as { clue: { text: string } }[])[0]!;
      triad.clue.text =
        "Knights of the Ebon Blade founder who broke away from the Scourge";
    });
    expect(codes(item, snapshotFor(item))).toContain("echoes-source");
    expect(sharedRuns("a b c d e", "x a b c d y", 4)).toEqual([["a", "b", "c", "d"]]);
    const lifted = research((draft) => {
      const dossier = (draft.dossiers as { facts: { says: string }[] }[])[0]!;
      dossier.facts[0]!.says = "Arthas purged the city of Stratholme";
      const triad = (draft.triads as { clue: { text: string } }[])[0]!;
      triad.clue.text = "Purged the city of Stratholme, then built a keep";
    });
    expect(codes(lifted, snapshotFor(lifted))).toContain("echoes-source");
  });

  it("refuses a Chronicle citation hidden in a source's reference", () => {
    const item = research((draft) => {
      const facts = (
        draft.dossiers as { facts: { sources: { cites?: string }[] }[] }[]
      )[0]!.facts;
      facts[0]!.sources[0]!.cites = "Ref WoWCV3 36";
    });
    expect(codes(item, snapshotFor(item))).toContain("excluded-source");
  });

  it("digests an inference's premises with it", () => {
    const item = research((draft) => {
      const triad = (draft.triads as { hint: { facts: string[] } }[])[0]!;
      triad.hint.facts = ["both"];
    });
    const before = triadDigest(item.triads[0]!, item.dossiers[0]!);
    const moved = research((draft) => {
      const triad = (draft.triads as { hint: { facts: string[] } }[])[0]!;
      triad.hint.facts = ["both"];
      const facts = (draft.dossiers as { facts: { says: string }[] }[])[0]!.facts;
      facts[1]!.says = "A friend thought him a dreamer";
    });
    expect(triadDigest(moved.triads[0]!, moved.dossiers[0]!)).not.toBe(before);
  });
});
