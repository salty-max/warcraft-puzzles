import { parseArgs } from "node:util";
import { fetchRevision, pageUrl, sentencesWithRefs } from "./wiki.ts";

// Reads a warcraft.wiki.gg page for a researcher: its pinned revision, then each sentence
// with the reference that covers it. Passages for a dossier are copied from this output,
// never from a summary.
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { revid: { type: "string" }, grep: { type: "string" } },
});
const title = positionals.join(" ");
if (!title && !values.revid)
  throw new Error('Usage: research-fetch "<Title>" [--revid N] [--grep word]');
const revision = await fetchRevision(
  values.revid ? { revid: Number(values.revid) } : { title },
  undefined,
  values.revid ? undefined : false,
);
console.log(`${revision.title}\n${pageUrl(revision.title)}\nrevid ${revision.revid}\n`);
const filter = values.grep?.toLowerCase();
for (const { sentence, refs } of sentencesWithRefs(revision.content)) {
  if (filter && !sentence.toLowerCase().includes(filter)) continue;
  console.log(
    `${sentence}\n    ${refs.some((ref) => !ref.startsWith("unresolved")) ? `[ref: ${refs.join(" | ")}]` : `[no ref${refs.length ? `: ${refs.join(" | ")}` : ""}]`}`,
  );
}
