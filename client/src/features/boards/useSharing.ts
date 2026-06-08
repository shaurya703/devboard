import { useMutation, useQuery } from "@tanstack/react-query";
import { BoardRole, CreateInviteInput } from "@devboard/shared";
import { boardsApi } from "./boards.api";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { toast } from "@/stores/uiStore";
import { getApiErrorMessage } from "@/lib/api";

export function useMembers(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.members(boardId),
    queryFn: () => boardsApi.members(boardId),
    enabled: enabled && !!boardId,
  });
}

export function useInvites(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["invites", boardId],
    queryFn: () => boardsApi.listInvites(boardId),
    enabled: enabled && !!boardId,
  });
}

function refreshSharing(boardId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.members(boardId) });
  queryClient.invalidateQueries({ queryKey: ["invites", boardId] });
  queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
}

export function useInvite(boardId: string) {
  return useMutation({
    mutationFn: (input: CreateInviteInput) => boardsApi.invite(boardId, input),
    onError: (err) => toast.error(getApiErrorMessage(err)),
    onSuccess: (res) => {
      toast.success(
        res.type === "member" ? "Member added" : "Invite created"
      );
      refreshSharing(boardId);
    },
  });
}

export function useRevokeInvite(boardId: string) {
  return useMutation({
    mutationFn: (inviteId: string) =>
      boardsApi.revokeInvite(boardId, inviteId),
    onError: (err) => toast.error(getApiErrorMessage(err)),
    onSuccess: () => refreshSharing(boardId),
  });
}

export function useUpdateMemberRole(boardId: string) {
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: BoardRole }) =>
      boardsApi.updateMemberRole(boardId, userId, role),
    onError: (err) => toast.error(getApiErrorMessage(err)),
    onSuccess: () => refreshSharing(boardId),
  });
}

export function useRemoveMember(boardId: string) {
  return useMutation({
    mutationFn: (userId: string) => boardsApi.removeMember(boardId, userId),
    onError: (err) => toast.error(getApiErrorMessage(err)),
    onSuccess: () => refreshSharing(boardId),
  });
}
