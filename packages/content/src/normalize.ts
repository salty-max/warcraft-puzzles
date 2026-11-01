/** Grid letters are English A–Z. Reject unsupported characters instead of losing them. */
export function normalizeAnswer(display: string): string {
  const trimmed = display.trim();
  if (!trimmed || !/^[A-Za-z]+(?:[ '\u2019-][A-Za-z]+)*$/.test(trimmed)) {
    throw new Error(`Unsupported answer spelling: ${JSON.stringify(display)}`);
  }
  return trimmed.replace(/[ '\u2019-]/g, "").toUpperCase();
}

/** Apostrophes do not split words. Spaces and hyphens do. */
export function enumerateAnswer(display: string): number[] {
  normalizeAnswer(display);
  return display
    .trim()
    .split(/[ -]/)
    .map((part) => part.replace(/['\u2019]/g, "").length);
}
