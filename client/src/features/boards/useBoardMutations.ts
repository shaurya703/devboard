import { useMutation } from "@tanstack/react-query";
import {
  BoardDetailDTO,
  CardDTO,
  CreateCardInput,
  UpdateCardInput,
} from "@devboard/shared";
import { boardsApi } from "./boards.api";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { toast } from "@/stores/uiStore";
import { getApiErrorMessage } from "@/lib/api";

type BoardData = { board: BoardDetailDTO };

/** Read/write the cached board detail; returns the previous snapshot. */
function patchBoard(
  boardId: string,
  updater: (board: BoardDetailDTO) => BoardDetailDTO
) {
  const key = queryKeys.board(boardId);
  const previous = queryClient.getQueryData<BoardData>(key);
  if (previous) {
    queryClient.setQueryData<BoardData>(key, {
      board: updater(previous.board),
    });
  }
  return previous;
}

function rollback(boardId: string, previous?: BoardData) {
  if (previous) queryClient.setQueryData(queryKeys.board(boardId), previous);
}

// --- Board ---

export function useRenameBoard(boardId: string) {
  return useMutation({
    mutationFn: (title: string) => boardsApi.update(boardId, title),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) });
      const previous = patchBoard(boardId, (board) => ({ ...board, title }));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      rollback(boardId, ctx?.previous);
      toast.error(getApiErrorMessage(err));
    },
  });
}

// --- Columns ---

export function useCreateColumn(boardId: string) {
  return useMutation({
    mutationFn: (title: string) => boardsApi.createColumn(boardId, { title }),
    onError: (err) => toast.error(getApiErrorMessage(err)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
}

export function useDeleteColumn(boardId: string) {
  return useMutation({
    mutationFn: (columnId: string) =>
      boardsApi.deleteColumn(boardId, columnId),
    onMutate: async (columnId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) });
      const previous = patchBoard(boardId, (board) => ({
        ...board,
        columns: board.columns.filter((c) => c.id !== columnId),
      }));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      rollback(boardId, ctx?.previous);
      toast.error(getApiErrorMessage(err));
    },
  });
}

export function useRenameColumn(boardId: string) {
  return useMutation({
    mutationFn: ({ columnId, title }: { columnId: string; title: string }) =>
      boardsApi.updateColumn(boardId, columnId, { title }),
    onMutate: async ({ columnId, title }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) });
      const previous = patchBoard(boardId, (board) => ({
        ...board,
        columns: board.columns.map((c) =>
          c.id === columnId ? { ...c, title } : c
        ),
      }));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      rollback(boardId, ctx?.previous);
      toast.error(getApiErrorMessage(err));
    },
  });
}

// --- Labels ---

export function useCreateLabel(boardId: string) {
  return useMutation({
    mutationFn: (input: { name: string; color: string }) =>
      boardsApi.createLabel(boardId, input),
    onError: (err) => toast.error(getApiErrorMessage(err)),
    onSuccess: (res) => {
      patchBoard(boardId, (board) => ({
        ...board,
        labels: [...board.labels, res.label],
      }));
    },
  });
}

// --- Cards ---

export function useCreateCard(boardId: string) {
  return useMutation({
    mutationFn: ({
      columnId,
      input,
    }: {
      columnId: string;
      input: CreateCardInput;
    }) => boardsApi.createCard(boardId, columnId, input),
    onError: (err) => toast.error(getApiErrorMessage(err)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
}

export function useUpdateCard(boardId: string) {
  return useMutation({
    mutationFn: ({
      cardId,
      input,
    }: {
      cardId: string;
      input: UpdateCardInput;
    }) => boardsApi.updateCard(boardId, cardId, input),
    onError: (err) => toast.error(getApiErrorMessage(err)),
    onSuccess: (res) => {
      // Reconcile the single card with the server's canonical version.
      patchBoard(boardId, (board) => ({
        ...board,
        columns: board.columns.map((col) => ({
          ...col,
          cards: col.cards.map((c) => (c.id === res.card.id ? res.card : c)),
        })),
      }));
    },
  });
}

export function useDeleteCard(boardId: string) {
  return useMutation({
    mutationFn: (cardId: string) => boardsApi.deleteCard(boardId, cardId),
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) });
      const previous = patchBoard(boardId, (board) => ({
        ...board,
        columns: board.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== cardId),
        })),
      }));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      rollback(boardId, ctx?.previous);
      toast.error(getApiErrorMessage(err));
    },
  });
}

/**
 * Move a card optimistically. The caller computes the post-move board state
 * (so the UI reflects the drop instantly) and passes the target column +
 * fractional position to persist.
 */
export function useMoveCard(boardId: string) {
  return useMutation({
    mutationFn: ({
      cardId,
      toColumnId,
      position,
    }: {
      cardId: string;
      toColumnId: string;
      position: number;
      optimistic: BoardDetailDTO;
    }) => boardsApi.moveCard(boardId, cardId, { toColumnId, position }),
    onMutate: async ({ optimistic }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) });
      const key = queryKeys.board(boardId);
      const previous = queryClient.getQueryData<BoardData>(key);
      queryClient.setQueryData<BoardData>(key, { board: optimistic });
      return { previous };
    },
    onError: (err, _v, ctx) => {
      rollback(boardId, ctx?.previous);
      toast.error(getApiErrorMessage(err));
    },
    onSuccess: (res: { card: CardDTO }) => {
      // Trust the server's canonical card (position/column) post-move.
      patchBoard(boardId, (board) => ({
        ...board,
        columns: board.columns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c.id === res.card.id ? res.card : c
          ),
        })),
      }));
    },
  });
}
