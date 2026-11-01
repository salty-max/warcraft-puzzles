# Warcraft Puzzles

Read `README.md`, `docs/editorial.md` and `docs/testing.md` before changes.

- Scope: Warcraft lore disclosed through the end of Wrath, with no later retcons.
- Every playable entry is an answer–clue–hint triad with evidence for both prompts.
- Do not pad the answer bank with obscure quest titles, routine loot or minor NPCs.
- Source facts come through `wow-data` exports or its read-only SQLite interface. No
  private database or local absolute path may be needed by normal CI.
- Research checks passing never auto-approve an entry or completed puzzle.
- Source changes invalidate evidence reviews. Wording changes invalidate approvals.
- Run `pnpm check` after changes. Do not weaken coverage thresholds to pass a change.
- Keep generated `docs/seed-report.md` synchronized with `pnpm content:report`.
- Use supported stable dependencies and preserve the frozen lockfile.
- New application behavior needs meaningful automated checks and appropriate
  browser/accessibility verification. Do not add placeholder or permanently skipped
  tests.
- Build the player mobile-first from its first screen. Phone, tablet and desktop
  layouts, touch input and phone-keyboard behavior are acceptance criteria for the first
  playable slice, not later polish. See the responsive contract in the plan.
- Deployment target: the owner's existing Vercel Pro plan. Do not create a new Vercel
  subscription or a different hosting project without a reason and direction.
