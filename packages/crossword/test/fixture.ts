export const mini = { id: "synthetic-mini", rows: ["...", "...", "..."] };
export const bank = ["ABC", "DEF", "GHI", "ADG", "BEH", "CFI"].map((grid, index) => ({
  id: `word-${index}`,
  grid,
}));
export const placements = [
  { slotId: "1A", entryId: "word-0" },
  { slotId: "4A", entryId: "word-1" },
  { slotId: "5A", entryId: "word-2" },
  { slotId: "1D", entryId: "word-3" },
  { slotId: "2D", entryId: "word-4" },
  { slotId: "3D", entryId: "word-5" },
];
