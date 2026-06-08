import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { boardsApi } from "./boards.api";
import { LoadingState, ErrorState } from "@/components/States";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { toast } from "@/stores/uiStore";

/** Accepts a board invite from /invite/:token, then redirects to the board. */
export function InviteAcceptPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React StrictMode double-invoke
    ran.current = true;
    (async () => {
      try {
        const { boardId } = await boardsApi.acceptInvite(token);
        await queryClient.invalidateQueries({ queryKey: queryKeys.boards });
        toast.success("Invite accepted");
        navigate(`/boards/${boardId}`, { replace: true });
      } catch {
        setError("This invite is invalid, expired, or issued to another email.");
      }
    })();
  }, [token, navigate]);

  if (error)
    return (
      <div className="flex h-full items-center justify-center">
        <ErrorState message={error} onRetry={() => navigate("/boards")} />
      </div>
    );
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingState label="Accepting invite…" />
    </div>
  );
}
