import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { normalizeText, WIKI_HOST } from "../packages/content/src/index.ts";

// warcraft.wiki.gg through its API: the one route that returns a page's text and its
// revision id together (the raw and parse routes sit behind Cloudflare). The text is
// cached in .cache/research, never committed: the wiki's prose stays theirs.

export type Revision = {
  title: string;
  pageid: number;
  revid: number;
  content: string;
};
export type Fetcher = (
  url: string,
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

const API = `https://${WIKI_HOST}/api.php`;
const USER_AGENT = "warcraft-puzzles lore research (https://github.com/salty-max)";
const cacheDir = new URL("../.cache/research/", import.meta.url);

export function titleFromUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.hostname !== WIKI_HOST || !parsed.pathname.startsWith("/wiki/")) {
    throw new Error(`Not a ${WIKI_HOST} page: ${url}`);
  }
  return decodeURIComponent(parsed.pathname.slice("/wiki/".length)).replace(/_/g, " ");
}

export function pageUrl(title: string): string {
  return `https://${WIKI_HOST}/wiki/${encodeURIComponent(title.replace(/ /g, "_")).replace(/%2F/g, "/").replace(/%3A/g, ":")}`;
}

function parseRevision(body: string): Revision {
  const json = JSON.parse(body) as {
    query?: {
      pages?: {
        title: string;
        pageid?: number;
        missing?: boolean;
        revisions?: { revid: number; slots: { main: { content: string } } }[];
      }[];
      badrevids?: unknown;
    };
  };
  const page = json.query?.pages?.[0];
  const revision = page?.revisions?.[0];
  if (!page || page.missing || !revision || json.query?.badrevids) {
    throw new Error("The wiki has no such page or revision");
  }
  return {
    title: page.title,
    pageid: page.pageid ?? 0,
    revid: revision.revid,
    content: revision.slots.main.content,
  };
}

/** The latest revision of a title, or one pinned revision. Pinned revisions are cached. */
export async function fetchRevision(
  target: { title: string } | { revid: number },
  fetcher: Fetcher = (url) => fetch(url, { headers: { "user-agent": USER_AGENT } }),
  cache: URL | false = cacheDir,
): Promise<Revision> {
  const cached =
    cache && "revid" in target ? new URL(`${target.revid}.json`, cache) : undefined;
  if (cached) {
    try {
      return JSON.parse(readFileSync(cached, "utf8")) as Revision;
    } catch {
      // not cached yet
    }
  }
  const query = new URLSearchParams({
    action: "query",
    prop: "revisions",
    rvprop: "ids|content",
    rvslots: "main",
    format: "json",
    formatversion: "2",
    redirects: "1",
    ...("revid" in target
      ? { revids: String(target.revid) }
      : { titles: target.title }),
  });
  const response = await fetcher(`${API}?${query}`);
  if (!response.ok) throw new Error(`The wiki answered ${response.status}`);
  const revision = parseRevision(await response.text());
  if (cache) {
    mkdirSync(cache, { recursive: true });
    writeFileSync(new URL(`${revision.revid}.json`, cache), JSON.stringify(revision));
  }
  return revision;
}

// Templates that put words on the page keep them. Every other template is dropped.
function templateText(body: string): string {
  const params = splitParams(body);
  const name = params.shift()!.trim().toLowerCase();
  const named = new Map<string, string>();
  const positional: string[] = [];
  for (const param of params) {
    const eq = param.indexOf("=");
    if (eq > 0 && /^[\w ]+$/.test(param.slice(0, eq))) {
      named.set(param.slice(0, eq).trim().toLowerCase(), param.slice(eq + 1).trim());
    } else positional.push(param.trim());
  }
  if (["npc", "quest", "item", "spell", "faction", "zone"].includes(name)) {
    return positional.filter(Boolean).at(-1) ?? "";
  }
  if (["book", "quote", "text", "blockquote"].includes(name)) {
    return named.get("content") ?? named.get("text") ?? positional[0] ?? "";
  }
  if (name === "lang" || name === "nowrap" || name === "tt")
    return positional.at(-1) ?? "";
  return "";
}

function splitParams(body: string): string[] {
  const params: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < body.length; i++) {
    const pair = body.slice(i, i + 2);
    if (pair === "[[") depth++;
    if (pair === "]]") depth--;
    if (body[i] === "|" && depth === 0) {
      params.push(current);
      current = "";
    } else current += body[i];
  }
  params.push(current);
  return params;
}

function replaceTemplates(text: string): string {
  let previous: string;
  do {
    previous = text;
    text = text.replace(/\{\{([^{}]*)\}\}/g, (_, body: string) => templateText(body));
  } while (text !== previous);
  return text;
}

/** Wikitext to the words a reader sees. One stripper for fetching and verifying. */
export function stripWikitext(source: string, keepRefs = false): string {
  let text = source.replace(/<!--[\s\S]*?-->/g, "");
  text = text.replace(/<ref\b([^>]*)\/>/gi, (_, attrs: string) =>
    keepRefs ? ` ⟦ref${refName(attrs)}⟧` : "",
  );
  text = text.replace(
    /<ref\b([^>]*)>([\s\S]*?)<\/ref>/gi,
    (_, attrs: string, body: string) =>
      keepRefs ? ` ⟦ref${refName(attrs)}:${refText(body)}⟧` : "",
  );
  text = replaceTemplates(text);
  text = text.replace(
    /\[\[(?:File|Image|Category):[^[\]]*(?:\[\[[^\]]*\]\][^[\]]*)*\]\]/gi,
    "",
  );
  text = text.replace(/\[\[:?([^|\]]*)\|([^\]]*)\]\]/g, "$2");
  text = text.replace(/\[\[:?([^\]]*)\]\]/g, "$1");
  text = text.replace(/\[https?:\/\/[^\s\]]+\s+([^\]]*)\]/g, "$1");
  text = text.replace(/'{2,}/g, "");
  text = text.replace(/<br\s*\/?>/gi, " ");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/^[*#:;]+\s*/, "")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .join("\n");
}

/**
 * A reference's words. Citation templates keep their name and arguments
 * ("Ref WoWCV3 36" is the Chronicle, volume 3): the era check depends on seeing them.
 */
export function refText(body: string): string {
  let text = body;
  let previous: string;
  do {
    previous = text;
    text = text.replace(/\{\{([^{}]*)\}\}/g, (_, inner: string) =>
      splitParams(inner)
        .map((param) => param.trim())
        .filter(Boolean)
        .join(" "),
    );
  } while (text !== previous);
  return stripWikitext(text).replace(/\s+/g, " ").trim();
}

function refName(attrs: string): string {
  const match = /name\s*=\s*"?([^"/>]+)"?/i.exec(attrs);
  return match ? ` ${match[1]!.trim()}` : "";
}

export function passageInRevision(passage: string, content: string): boolean {
  return normalizeText(stripWikitext(content)).includes(normalizeText(passage));
}

/**
 * Each sentence with the reference that covers it, named references resolved to their
 * one definition. A reference covers the sentence before it, never the ones after. An
 * "unresolved" reference counts as none.
 */
export function sentencesWithRefs(
  content: string,
): { sentence: string; refs: string[] }[] {
  // Definitions come from the raw text: one inside an infobox would vanish with it.
  const definitions = new Map<string, string>();
  for (const match of content.matchAll(/<ref\b([^>]*[^/])>([\s\S]*?)<\/ref>/gi)) {
    const name = refName(match[1]!).trim();
    if (name) definitions.set(name, refText(match[2]!));
  }
  const marked = stripWikitext(content, true);
  const out: { sentence: string; refs: string[] }[] = [];
  for (const line of marked.split("\n")) {
    if (!line || /^(\||\{\||=|File:|Image:)/.test(line)) continue;
    // Split after a sentence's closing references, never inside one.
    const parts = line.split(
      /(?<=[.!?]["']?(?:\s*⟦[^⟧]*⟧)*)\s+(?=[A-Z0-9"'])(?![^⟦]*⟧)/,
    );
    for (const part of parts) {
      const refs: string[] = [];
      const sentence = part
        .replace(
          /\s*⟦ref( [^:⟧]+)?(?::([^⟧]*))?⟧/g,
          (_, name?: string, body?: string) => {
            const resolved =
              body?.trim() || (name ? definitions.get(name.trim()) : undefined);
            refs.push(resolved || `unresolved${name ? ` ${name.trim()}` : ""}`);
            return "";
          },
        )
        .trim();
      if (!sentence) {
        if (refs.length && out.length) out.at(-1)!.refs.push(...refs);
        continue;
      }
      out.push({ sentence: normalizeText(sentence), refs });
    }
  }
  return out;
}
