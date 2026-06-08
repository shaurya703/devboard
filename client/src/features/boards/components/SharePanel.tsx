import { FormEvent, useState } from "react";
import { BoardDetailDTO, BoardRole } from "@devboard/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/States";
import {
  useMembers,
  useInvites,
  useInvite,
  useRevokeInvite,
  useUpdateMemberRole,
  useRemoveMember,
} from "../useSharing";
import { toast } from "@/stores/uiStore";

export function SharePanel({
  board,
  open,
}: {
  board: BoardDetailDTO;
  open: boolean;
}) {
  const boardId = board.id;
  const isOwner = board.role === BoardRole.OWNER;
  const members = useMembers(boardId, open);
  const invites = useInvites(boardId, open && isOwner);
  const invite = useInvite(boardId);
  const revoke = useRevokeInvite(boardId);
  const updateRole = useUpdateMemberRole(boardId);
  const removeMember = useRemoveMember(boardId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    const res = await invite.mutateAsync({ email: email.trim(), role });
    setEmail("");
    if (res.type === "invite") {
      const link = `${window.location.origin}/invite/${res.invite.token}`;
      navigator.clipboard?.writeText(link).catch(() => {});
      toast.info("Invite link copied to clipboard");
    }
  }

  const memberList = members.data?.members ?? [];

  return (
    <div className="space-y-6">
      {isOwner && (
        <form onSubmit={onInvite} className="space-y-2">
          <Input
            label="Invite by email"
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <Button type="submit" loading={invite.isPending} className="flex-1">
              Send invite
            </Button>
          </div>
        </form>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Members
        </h3>
        {members.isLoading ? (
          <LoadingState label="Loading members…" />
        ) : (
          <ul className="space-y-2">
            {memberList.map((m) => (
              <li
                key={m.userId}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-200 p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {m.user.name}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {m.user.email}
                  </p>
                </div>
                {isOwner && m.role !== BoardRole.OWNER ? (
                  <div className="flex items-center gap-1">
                    <select
                      value={m.role}
                      onChange={(e) =>
                        updateRole.mutate({
                          userId: m.userId,
                          role: e.target.value as BoardRole,
                        })
                      }
                      className="rounded border border-slate-300 px-1.5 py-1 text-xs"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <button
                      onClick={() => removeMember.mutate(m.userId)}
                      className="text-xs text-slate-400 hover:text-red-600"
                      title="Remove member"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {m.role.toLowerCase()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isOwner && (invites.data?.invites.length ?? 0) > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pending invites
          </h3>
          <ul className="space-y-2">
            {invites.data!.invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-2 rounded-md border border-dashed border-slate-300 p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-700">{inv.email}</p>
                  <p className="text-xs text-slate-400">
                    {inv.role.toLowerCase()} · pending
                  </p>
                </div>
                <button
                  onClick={() => revoke.mutate(inv.id)}
                  className="text-xs text-slate-400 hover:text-red-600"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
