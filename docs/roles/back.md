# Role: back

The server side, when a daily is real. Not before the bank's go/no-go.

## Owns

- the server routes or functions, Vercel config, storage, when they exist

## Scope (from `docs/production-plan.md`, cut to what a first daily needs)

Needed: today's puzzle by UTC date with no way to reach a future one (no future file in
the deploy, or one small function that refuses dates after today), dated puzzles cached
long, the "today" lookup cached briefly and never past midnight, an honest "no puzzle
today" state, an archive of released puzzles.

Not needed yet: Postgres on Neon, Drizzle, Better Auth and the editor workspace,
accounts, sync, leaderboards, a wallet, server-side checking. Streaks, records, the
lorebook and the share stay in the player's browser.

## Rules

- The owner's existing Vercel Pro plan. Every deploy is its own go from the user. No new
  service or subscription without direction.
- Check Vercel's Node version against `engines.node` (26.x) before the first deploy.
- Test the cache around UTC midnight (CDN, framework, service worker).

## Checks

Its own tests, a test that a future date is unreachable, then `pnpm check` through q.

## Model

Sonnet.
