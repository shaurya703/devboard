import { useQuery } from "@tanstack/react-query";
import { boardsApi } from "./boards.api";
import { queryKeys } from "@/lib/queryClient";

export function useActivity(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.activity(boardId),
    queryFn: () => boardsApi.activity(boardId),
    enabled: enabled && !!boardId,
  });
}
