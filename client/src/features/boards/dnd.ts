import { BoardDetailDTO, CardDTO } from "@devboard/shared";

const GAP = 1000;

/**
 * Compute the fractional position for inserting a card at `index` within an
 * ordered list of cards (the list must NOT include the card being moved).
 */
export function positionForIndex(cards: CardDTO[], index: number): number {
  const before = cards[index - 1];
  const after = cards[index];
  if (!before && !after) return GAP;
  if (!before) return after.position / 2;
  if (!after) return before.position + GAP;
  return (before.position + after.position) / 2;
}

export interface MoveResult {
  board: BoardDetailDTO;
  toColumnId: string;
  position: number;
}

/**
 * Produce the post-move board (cards reordered, moved card relabeled with its
 * new column + fractional position) plus the values to persist. Returns null
 * if the move is a no-op.
 */
export function computeMove(
  board: BoardDetailDTO,
  cardId: string,
  toColumnId: string,
  toIndex: number
): MoveResult | null {
  const fromColumn = board.columns.find((c) =>
    c.cards.some((card) => card.id === cardId)
  );
  if (!fromColumn) return null;
  const card = fromColumn.cards.find((c) => c.id === cardId)!;
  const toColumn = board.columns.find((c) => c.id === toColumnId);
  if (!toColumn) return null;

  // Target list without the moved card (for correct neighbor math).
  const targetCards = toColumn.cards.filter((c) => c.id !== cardId);
  const clampedIndex = Math.max(0, Math.min(toIndex, targetCards.length));
  const position = positionForIndex(targetCards, clampedIndex);

  const movedCard: CardDTO = { ...card, columnId: toColumnId, position };

  const columns = board.columns.map((col) => {
    if (col.id === fromColumn.id && col.id === toColumnId) {
      // Same-column reorder.
      const next = [...targetCards];
      next.splice(clampedIndex, 0, movedCard);
      return { ...col, cards: next };
    }
    if (col.id === fromColumn.id) {
      return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
    }
    if (col.id === toColumnId) {
      const next = [...targetCards];
      next.splice(clampedIndex, 0, movedCard);
      return { ...col, cards: next };
    }
    return col;
  });

  return { board: { ...board, columns }, toColumnId, position };
}
