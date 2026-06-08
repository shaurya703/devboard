import { useMutation, useQuery } from "@tanstack/react-query";
import { boardsApi } from "./boards.api";
import { queryClient, queryKeys } from "@/lib/queryClient";

/** Board list for the dashboard. */
export function useBoards() {
  return useQuery({
    queryKey: queryKeys.boards,
    queryFn: boardsApi.list,
  });
}

/** Full board detail (columns, cards, labels, members). */
export function useBoard(boardId: string) {
  return useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: () => boardsApi.get(boardId),
    enabled: !!boardId,
  });
}

export function useCreateBoard() {
  return useMutation({
    mutationFn: (title: string) => boardsApi.create({ title }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.boards }),
  });
}

export function useDeleteBoard() {
  return useMutation({
    mutationFn: (id: string) => boardsApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.boards }),
  });
}
