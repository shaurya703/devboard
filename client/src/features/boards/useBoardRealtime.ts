import { useEffect } from "react";
import {
  BoardDetailDTO,
  CardDTO,
  ColumnDTO,
  ActivityDTO,
  BoardMemberDTO,
  SOCKET_EVENTS,
  CardMovedPayload,
  CardDeletedPayload,
  ColumnDeletedPayload,
} from "@devboard/shared";
import { getSocket, connectSocket } from "@/lib/socket";
import { queryClient, queryKeys } from "@/lib/queryClient";

type BoardData = { board: BoardDetailDTO };

/**
 * Subscribe to a board's realtime room and reconcile incoming events into the
 * TanStack Query cache, so a change by one user appears for all others.
 *
 * Events are idempotent merges: we upsert by id rather than blindly appending,
 * which keeps the local optimistic author in sync with the echoed event.
 */
export function useBoardRealtime(boardId: string) {
  useEffect(() => {
    if (!boardId) return;
    const socket = getSocket();
    connectSocket();
    socket.emit(SOCKET_EVENTS.JOIN_BOARD, boardId);

    const key = queryKeys.board(boardId);
    const patch = (updater: (b: BoardDetailDTO) => BoardDetailDTO) => {
      const prev = queryClient.getQueryData<BoardData>(key);
      if (prev) queryClient.setQueryData<BoardData>(key, { board: updater(prev.board) });
    };

    const upsertCard = (card: CardDTO) =>
      patch((board) => ({
        ...board,
        columns: board.columns.map((col) => {
          const without = col.cards.filter((c) => c.id !== card.id);
          if (col.id === card.columnId) {
            return {
              ...col,
              cards: [...without, card].sort((a, b) => a.position - b.position),
            };
          }
          return { ...col, cards: without };
        }),
      }));

    const onCardCreated = (card: CardDTO) => upsertCard(card);
    const onCardUpdated = (card: CardDTO) => upsertCard(card);
    const onCardMoved = (p: CardMovedPayload) => upsertCard(p.card);
    const onCardDeleted = (p: CardDeletedPayload) =>
      patch((board) => ({
        ...board,
        columns: board.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== p.cardId),
        })),
      }));

    const onColumnCreated = (column: ColumnDTO) =>
      patch((board) =>
        board.columns.some((c) => c.id === column.id)
          ? board
          : {
              ...board,
              columns: [...board.columns, column].sort(
                (a, b) => a.position - b.position
              ),
            }
      );
    const onColumnUpdated = (column: ColumnDTO) =>
      patch((board) => ({
        ...board,
        columns: board.columns
          .map((c) => (c.id === column.id ? { ...c, title: column.title, position: column.position } : c))
          .sort((a, b) => a.position - b.position),
      }));
    const onColumnDeleted = (p: ColumnDeletedPayload) =>
      patch((board) => ({
        ...board,
        columns: board.columns.filter((c) => c.id !== p.columnId),
      }));

    const onBoardUpdated = (incoming: BoardDetailDTO) =>
      patch((board) => ({ ...board, title: incoming.title }));

    const onMemberChanged = (members: BoardMemberDTO[]) => {
      patch((board) => ({ ...board, members, memberCount: members.length }));
      queryClient.setQueryData(queryKeys.members(boardId), { members });
    };

    const onActivity = (activity: ActivityDTO) => {
      queryClient.setQueryData<{ activities: ActivityDTO[] }>(
        queryKeys.activity(boardId),
        (prev) =>
          prev
            ? { activities: [activity, ...prev.activities].slice(0, 50) }
            : { activities: [activity] }
      );
    };

    socket.on(SOCKET_EVENTS.CARD_CREATED, onCardCreated);
    socket.on(SOCKET_EVENTS.CARD_UPDATED, onCardUpdated);
    socket.on(SOCKET_EVENTS.CARD_MOVED, onCardMoved);
    socket.on(SOCKET_EVENTS.CARD_DELETED, onCardDeleted);
    socket.on(SOCKET_EVENTS.COLUMN_CREATED, onColumnCreated);
    socket.on(SOCKET_EVENTS.COLUMN_UPDATED, onColumnUpdated);
    socket.on(SOCKET_EVENTS.COLUMN_DELETED, onColumnDeleted);
    socket.on(SOCKET_EVENTS.BOARD_UPDATED, onBoardUpdated);
    socket.on(SOCKET_EVENTS.MEMBER_CHANGED, onMemberChanged);
    socket.on(SOCKET_EVENTS.ACTIVITY_CREATED, onActivity);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_BOARD, boardId);
      socket.off(SOCKET_EVENTS.CARD_CREATED, onCardCreated);
      socket.off(SOCKET_EVENTS.CARD_UPDATED, onCardUpdated);
      socket.off(SOCKET_EVENTS.CARD_MOVED, onCardMoved);
      socket.off(SOCKET_EVENTS.CARD_DELETED, onCardDeleted);
      socket.off(SOCKET_EVENTS.COLUMN_CREATED, onColumnCreated);
      socket.off(SOCKET_EVENTS.COLUMN_UPDATED, onColumnUpdated);
      socket.off(SOCKET_EVENTS.COLUMN_DELETED, onColumnDeleted);
      socket.off(SOCKET_EVENTS.BOARD_UPDATED, onBoardUpdated);
      socket.off(SOCKET_EVENTS.MEMBER_CHANGED, onMemberChanged);
      socket.off(SOCKET_EVENTS.ACTIVITY_CREATED, onActivity);
    };
  }, [boardId]);
}
