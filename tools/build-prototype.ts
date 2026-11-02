import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import ts from "typescript";
import { playIds, preparePlayset } from "./prototype-set.ts";

const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const catalogue = read("content/seed/editorial.json");
const evidence = read("content/seed/evidence.json");
const trials = preparePlayset(
  playIds(readdirSync("content/puzzles")),
  (id) => read(`content/puzzles/${id}.json`),
  catalogue,
  evidence,
);
if (!trials.length) throw new Error("No content/puzzles/play-N.json to build");
const output = ".cache/prototype";
mkdirSync(output, { recursive: true });
for (const name of ["player", "model"]) {
  const { outputText } = ts.transpileModule(readFileSync(`web/${name}.ts`, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
  });
  writeFileSync(`${output}/${name}.js`, outputText);
}
const style = readFileSync("web/style.css", "utf8");
writeFileSync(`${output}/style.css`, style);
mkdirSync(`${output}/fonts`, { recursive: true });
const fonts = readdirSync("web/fonts").filter((name) => name.endsWith(".woff2"));
for (const name of fonts) copyFileSync(`web/fonts/${name}`, `${output}/fonts/${name}`);
/** The crest on the tab: a gold diamond on the night. */
const favicon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#120d09"/><path d="M16 4l11 12-11 12L5 16z" fill="#c9a227"/><path d="M16 9l6 7-6 7-6-7z" fill="#2a1d12"/></svg>';
writeFileSync(`${output}/favicon.svg`, favicon);
for (const trial of trials) {
  const { playable } = trial;
  const html = readFileSync("web/index.html", "utf8")
    .replace(
      "<title>Warcraft crossword</title>",
      `<title>${trial.number}. ${playable.title} · Warcraft crossword</title>`,
    )
    .replace("__PUZZLE_JSON__", () => JSON.stringify(playable).replace(/</g, "\\u003c"))
    .replace("__TITLE__", () => playable.title)
    .replaceAll("__ARCHIVE_LINK__", "/");
  writeFileSync(`${output}/${trial.id}.html`, html);
  console.log(
    `Built ${trial.id}: ${playable.entries.length} entries, ${playable.width} by ${playable.height}.`,
  );
}
const links = trials
  .map(
    (trial) =>
      `<li><a href="${trial.route}"><span class="no">${trial.number}</span> <span class="level">${trial.playable.title}</span> <span class="meta">${trial.playable.entries.length} clues, ${trial.playable.width} by ${trial.playable.height}</span></a></li>`,
  )
  .join("");
writeFileSync(
  `${output}/archive.html`,
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#120d09"><title>Crosswords</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"></head><body><main class="archive"><header class="masthead"><h1 class="title-gilded">Warcraft crossword</h1><p class="rule" aria-hidden="true"></p></header><p class="archive-intro">${trials.length} puzzles. Choose one and type straight into the grid. Your letters are saved on this device.</p><ol class="puzzle-list">${links}</ol><footer>Unofficial Warcraft fan project. Not affiliated with Blizzard Entertainment.</footer></main></body></html>`,
);
