import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { expect, it } from "vitest";
import {
  refText,
  fetchRevision,
  pageUrl,
  passageInRevision,
  sentencesWithRefs,
  stripWikitext,
  titleFromUrl,
} from "./wiki.ts";
import { readEntityName, readSourceRow } from "./evidence.ts";

const page = [
  "{{Npcbox| name = Edwin VanCleef}}",
  "'''Edwin VanCleef''' was the elected Guildmaster of the [[Stonemasons]].<ref name=Report>[[Report on the Defias Brotherhood]]</ref> He also led the construction of [[Nethergarde Keep|the keep]].<ref>''[[Beyond the Dark Portal]]''</ref>",
  "He rioted.<ref name=Report /> The queen died. Later he hid.",
  "* A {{NPC||Baros Alexston}} letter: {{Book|content=an idealist, and a romantic}}.<!-- hidden -->",
  "[[File:VanCleef.jpg|thumb|A [[ship]]]] See [https://example.com the site] &amp; more<br/>here.",
  "File:Gallery.jpg|caption",
].join("\n");

it("strips wikitext to the words a reader sees", () => {
  const text = stripWikitext(page);
  expect(text).toContain(
    "Edwin VanCleef was the elected Guildmaster of the Stonemasons.",
  );
  expect(text).toContain("led the construction of the keep.");
  expect(text).toContain("A Baros Alexston letter: an idealist, and a romantic.");
  expect(text).toContain("See the site & more here.");
  expect(text).not.toContain("Npcbox");
  expect(text).not.toContain("hidden");
  expect(text).not.toContain("thumb");
  expect(passageInRevision("led the construction of the keep", page)).toBe(true);
  expect(passageInRevision("led the construction of Nethergarde Keep", page)).toBe(
    false,
  );
});

it("ties each sentence to the reference that follows it, never the next one", () => {
  const sentences = sentencesWithRefs(page);
  const find = (start: string) =>
    sentences.find((item) => item.sentence.startsWith(start));
  expect(find("Edwin VanCleef was")?.refs).toEqual([
    "Report on the Defias Brotherhood",
  ]);
  expect(find("He also led")?.refs).toEqual(["Beyond the Dark Portal"]);
  expect(find("He rioted")?.refs).toEqual(["Report on the Defias Brotherhood"]);
  expect(find("The queen died")?.refs).toEqual([]);
  expect(sentences.some((item) => item.sentence.startsWith("File:"))).toBe(false);
});

it("keeps a reference standing on its own line with the sentence before it", () => {
  const sentences = sentencesWithRefs("A claim.\n<ref>Source</ref>\n<ref name=x/>");
  expect(sentences).toEqual([
    { sentence: "A claim.", refs: ["Source", "unresolved x"] },
  ]);
});

it("maps wiki URLs to titles and back", () => {
  expect(titleFromUrl("https://warcraft.wiki.gg/wiki/Duskwood_(Classic)")).toBe(
    "Duskwood (Classic)",
  );
  expect(pageUrl("Duskwood (Classic)")).toBe(
    "https://warcraft.wiki.gg/wiki/Duskwood_(Classic)",
  );
  expect(() => titleFromUrl("https://wowpedia.fandom.com/wiki/Duskwood")).toThrow(
    "Not a warcraft.wiki.gg page",
  );
});

it("fetches a revision through the API, and refuses errors and missing pages", async () => {
  const urls: string[] = [];
  const answer = (status: number, body: unknown) => (url: string) => {
    urls.push(url);
    return Promise.resolve({
      ok: status === 200,
      status,
      text: () => Promise.resolve(JSON.stringify(body)),
    });
  };
  const body = {
    query: {
      pages: [
        {
          title: "Fel",
          pageid: 7,
          revisions: [{ revid: 42, slots: { main: { content: "Fel text" } } }],
        },
      ],
    },
  };
  expect(await fetchRevision({ title: "Fel" }, answer(200, body), false)).toEqual({
    title: "Fel",
    pageid: 7,
    revid: 42,
    content: "Fel text",
  });
  expect(urls[0]).toContain("titles=Fel");
  await fetchRevision({ revid: 42 }, answer(200, body), false);
  expect(urls[1]).toContain("revids=42");
  await expect(fetchRevision({ title: "Fel" }, answer(403, {}), false)).rejects.toThrow(
    "answered 403",
  );
  await expect(
    fetchRevision(
      { title: "Nope" },
      answer(200, { query: { pages: [{ title: "Nope", missing: true }] } }),
      false,
    ),
  ).rejects.toThrow("no such page");
});

it("reads citable rows and answer names through parameterised queries", () => {
  const calls: unknown[][] = [];
  const database = {
    prepare: (sql: string) => ({
      get: (...args: (string | number)[]) => {
        calls.push([sql.split(" ")[3], ...args]);
        return sql.includes("SELECT name")
          ? { name: "Duskwood" }
          : { source: "client" };
      },
    }),
  };
  readSourceRow(database, {
    table: "readable_page",
    kind: "item",
    id: 1,
    locale: "enUS",
    idx: 1,
  });
  readSourceRow(database, {
    table: "quest_text",
    quest_id: 2,
    locale: "enUS",
    field: "details",
  });
  readSourceRow(database, { table: "name", kind: "area", id: 10, locale: "enUS" });
  expect(calls.map((call) => call[0])).toEqual(["readable_page", "quest_text", "name"]);
  expect(readEntityName(database, "area", 10)).toBe("Duskwood");
  expect(
    readEntityName({ prepare: () => ({ get: () => undefined }) }, "area", 10),
  ).toBeUndefined();
});

it("caches pinned revisions and reads them back without the network", async () => {
  const dir = pathToFileURL(`${mkdtempSync(`${tmpdir()}/wiki-`)}/`);
  let calls = 0;
  const body = JSON.stringify({
    query: {
      pages: [
        {
          title: "Orc",
          revisions: [{ revid: 9, slots: { main: { content: "Orcs" } } }],
        },
      ],
    },
  });
  const fetcher = () => {
    calls++;
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(body),
    });
  };
  expect((await fetchRevision({ revid: 9 }, fetcher, dir)).pageid).toBe(0);
  expect((await fetchRevision({ revid: 9 }, fetcher, dir)).content).toBe("Orcs");
  expect(calls).toBe(1);
});

it("keeps the words of text-bearing templates only", () => {
  expect(
    stripWikitext(
      "{{Quote|They came.}} {{lang|zh|Ni hao}} {{Book|text=Pages}} {{Quest|1|The Defias}} {{Zone|}} {{Infobox|a=b}}",
    ),
  ).toBe("They came. Ni hao Pages The Defias");
});

it("shows citation templates and infobox definitions, and flags what it can't resolve", () => {
  const content = [
    "{{Infobox | note = x<ref name=Shaw>[[Shaw's Report]]</ref>}}",
    "He hid.<ref>{{Ref WoWCV3|36}}</ref> He trained.<ref name=Shaw /> He wept.<ref name=Ghost />",
  ].join("\n");
  const refs = Object.fromEntries(
    sentencesWithRefs(content).map((item) => [item.sentence, item.refs]),
  );
  expect(refs["He hid."]).toEqual(["Ref WoWCV3 36"]);
  expect(refs["He trained."]).toEqual(["Shaw's Report"]);
  expect(refs["He wept."]).toEqual(["unresolved Ghost"]);
  expect(refText("''{{Cite|[[Rise of the Horde]]|pg. 498}}''")).toBe(
    "Cite Rise of the Horde pg. 498",
  );
});
