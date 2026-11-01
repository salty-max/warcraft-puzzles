import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const paths = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/medium", ["medium-index.html", "text/html; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/player.js", ["player.js", "text/javascript; charset=utf-8"]],
  ["/model.js", ["model.js", "text/javascript; charset=utf-8"]],
]);
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
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );
  response.setHeader("Content-Type", file[1]!);
  response.end(readFileSync(`.cache/prototype/${file[0]}`));
}).listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${port}`);
});
