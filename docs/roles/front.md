# Role: front

The player's page, phone first.

## Owns

- `web/` (the page, the model, the styles)
- `browser/` (Playwright tests), `playwright.config.ts`
- `tools/build-prototype.ts`, `tools/serve-prototype.ts`

## Rules

- Mobile-first acceptance: phone, tablet and desktop layouts, touch, the phone keyboard,
  no sideways scroll at 375 px. Screenshot it at phone width.
- **Crossings are the point.** The first fix: typing in the answer box must not wipe
  letters a crossing entry gave (`web/player.ts`, `web/model.ts`, the audit's worst code
  finding), and a focused grid cell takes letters. Tests assert the shared letter
  survives.
- Feedback a player needs (Check's result) is in view of the clue being worked, on a
  phone too.
- Accessibility: axe passes, the live region announces only what changed, arrow keys
  keep the direction.
- Every user-visible string in British English, no semicolons.
- Answers in the page are fine for play and offline (the plan's own words), not for
  rewards.

## Checks

`pnpm test:browser`, `pnpm prototype:check`, then `pnpm check` through q.
`web/player.ts` and the build tools are outside the coverage figure: the browser tests
are their real check.

## Model

Sonnet.
