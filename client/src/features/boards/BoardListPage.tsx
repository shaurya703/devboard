import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { BoardRole } from "@devboard/shared";
import { useBoards, useCreateBoard, useDeleteBoard } from "./useBoards";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";
import { toast } from "@/stores/uiStore";
import { getApiErrorMessage } from "@/lib/api";

const roleBadge: Record<BoardRole, string> = {
  OWNER: "bg-indigo-100 text-indigo-700",
  EDITOR: "bg-emerald-100 text-emerald-700",
  VIEWER: "bg-slate-100 text-slate-600",
};

export function BoardListPage() {
  const { data, isLoading, isError, refetch } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createBoard.mutateAsync(title.trim());
      setTitle("");
      setOpen(false);
      toast.success("Board created");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete board "${name}"? This cannot be undone.`)) return;
    try {
      await deleteBoard.mutateAsync(id);
      toast.success("Board deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Your boards</h1>
          <p className="text-sm text-slate-500">
            Boards you own or collaborate on.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New board</Button>
      </div>

      {isLoading && <LoadingState label="Loading boards…" />}
      {isError && (
        <ErrorState message="Couldn't load boards." onRetry={() => refetch()} />
      )}

      {data && data.boards.length === 0 && (
        <EmptyState
          title="No boards yet"
          description="Create your first board to start organizing tasks."
          action={<Button onClick={() => setOpen(true)}>+ New board</Button>}
        />
      )}

      {data && data.boards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.boards.map((b) => (
            <div
              key={b.id}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <Link to={`/boards/${b.id}`} className="block">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 font-semibold text-slate-800">
                    {b.title}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[b.role]}`}
                  >
                    {b.role.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {b.memberCount} member{b.memberCount === 1 ? "" : "s"}
                </p>
              </Link>
              {b.role === "OWNER" && (
                <button
                  onClick={() => onDelete(b.id, b.title)}
                  className="absolute bottom-3 right-3 text-xs text-slate-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a new board"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onCreate as never}
              loading={createBoard.isPending}
            >
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={onCreate}>
          <Input
            label="Board title"
            placeholder="e.g. Q3 Roadmap"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
}
