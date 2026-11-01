# The player's look and input

Redone from the ground up on 1 November 2026, replacing the first trial's page. The
family's look, shaped for a puzzle board and not a journal.

## The look

- **A dark leather night lit by two braziers** (a glow in each top corner, where
  Hearthtale has one hearth below), a faint tooled grain, and by day the same table in
  the scribe's light. The page follows `prefers-color-scheme`, dark by default.
- **The board** is dark inlaid wood with a gold double rule. Squares are parchment
  tiles, blocks are recessed stone. The word being worked is washed gold, the square
  being typed in is bright gold with an ember ring, and a wrong square after Check is
  red with a hatch so it never relies on colour alone. The board stays dark in both
  themes.
- **The clue** is a parchment scroll that sticks to the top while the grid is worked.
  The hint and Check's result appear inside it, so they are in view on a phone.
- **The clue lists** are a parchment book, Across and Down, scrolling on their own
  beside the board on a desktop and stacked below it on a phone. A diamond marks a clue
  whose squares are all filled (not that it is right), the crossing clue is washed
  lightly.
- **Type:** Cinzel for titles, numbers and letters, EB Garamond for the clue text, the
  system face for small frame text. The faces ship in `web/fonts/` (SIL Open Font
  License, texts beside them), are served from `/fonts/` and are embedded in the offline
  single files, so those still need no server or network.
- **Tokens** are at the top of `web/style.css`. The gold, leather, parchment and ember
  are Hearthtale's. The braziers, the board and the scroll are this project's own.

## The input

- Tap or click a square, then type. The letter fills the square and the cursor moves on.
  Tapping the same square again, or Space, turns across and down. Arrows turn first when
  the square has a word that way, then walk. Backspace clears this square, or steps
  back. Enter and Shift+Enter go to the next and previous clue, Home and End to the ends
  of the word. Tab keeps its normal job, so there is no keyboard trap.
- A choice from the clue list puts the cursor on the word's first empty square.
- One hidden text input (`#keys`) takes the keyboard, so a phone brings up its own. It
  also accepts a whole answer sent at once (a paste, a predictive word) and sets it
  letter by letter. Squares are buttons outside the tab order, kept for taps and screen
  readers.
- The cursor and typing rules are pure functions in `web/model.ts` (`typeLetter`,
  `backspace`, `moveArrow`, `toggleDirection`, `startCursor`, `wrongCells`,
  `describeCursor`), tested there. `web/player.ts` only wires them to the page.
- **Input methods:** when a phone or desktop input method starts composing, the grid is
  saved, and every update of the composition is rebuilt from that copy. A resent buffer
  never doubles, a shrinking or replaced word puts back exactly what it overwrote
  (including a crossing's letter) and a cancelled composition keeps what was shown.
  Firefox ends a composition before its last input and Chrome after it, and both are
  handled. Using a square, a clue, Hint, Reveal or Check ends a composition, so a stale
  copy never undoes what was just done. The input method's own keys are left to it.
- **Focus after a button:** Hint and Reveal return to the grid only if the player
  pressed them while typing, so a phone keyboard does not reopen over the board. Check
  never does and closes the keyboard, so the marked squares stay in view.
- **Screen readers:** `#where` speaks the square, its place in the word and the letters
  so far each time the cursor moves. The clue, the hint and Check's result are live
  regions that always exist, so their first change is announced.
- The saved state is unchanged, so earlier saves still load.

## What is not proven

A real phone keyboard (iOS Safari, Android Chrome) and a screen-reader pass are still
manual checks. The browser tests cover touch focus, the five viewports, axe in light and
dark and the offline files in Chromium, Firefox and WebKit, not those.
