/** Gap between sequential positions when appending to a list. */
export const POSITION_GAP = 1000;

/** Next append position given the current max (or null when the list is empty). */
export const nextPosition = (currentMax: number | null): number =>
  (currentMax ?? 0) + POSITION_GAP;
