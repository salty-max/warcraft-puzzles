import { createServer } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import { PilotSchema, trialRoute, trialAsset } from "./pilot.ts";
const paths = new Map([
  ["/pilot", ["pilot-index.html", "text/html; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/player.js", ["player.js", "text/javascript; charset=utf-8"]],
  ["/model.js", ["model.js", "text/javascript; charset=utf-8"]],
]);
paths.set("/favicon.svg", ["favicon.svg", "image/svg+xml"]);
for (const name of readdirSync("web/fonts").filter((file) => file.endsWith(".woff2")))
  paths.set(`/fonts/${name}`, [`fonts/${name}`, "font/woff2"]);
for (const trial of PilotSchema.parse(
  JSON.parse(readFileSync("content/puzzles/pilot.json", "utf8")),
).trials)
  paths.set(trialRoute(trial), [trialAsset(trial), "text/html; charset=utf-8"]);
const port = Number(process.env.PROTOTYPE_PORT ?? 4173);
createServer((request, response) => {
  const file = paths.get(request.url ?? "");
  if (!file) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );
  response.setHeader("Content-Type", file[1]!);
  response.end(readFileSync(`.cache/prototype/${file[0]}`));
}).listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${port}`);
});
