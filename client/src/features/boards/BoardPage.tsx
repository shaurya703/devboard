import { Link, useParams } from "react-router-dom";
import { useBoard } from "./useBoards";
import { LoadingState, ErrorState } from "@/components/States";

/**
 * Read-only board view (Step 6). Step 7 replaces this with the interactive
 * drag-and-drop board, card editor, and optimistic updates.
 */
export function BoardPage() {
  const { boardId = "" } = useParams();
  const { data, isLoading, isError, refetch } = useBoard(boardId);

  if (isLoading) return <LoadingState label="Loading board…" />;
  if (isError || !data)
    return <ErrorState message="Couldn't load this board." onRetry={refetch} />;

  const board = data.board;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link to="/boards" className="text-sm text-slate-500 hover:text-slate-700">
          ← Boards
        </Link>
        <h1 className="font-semibold text-slate-800">{board.title}</h1>
      </div>
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {board.columns.map((col) => (
          <div
            key={col.id}
            className="flex w-72 shrink-0 flex-col rounded-lg bg-surface-200/60 p-2"
          >
            <h2 className="px-2 py-1 text-sm font-semibold text-slate-700">
              {col.title}{" "}
              <span className="text-slate-400">{col.cards.length}</span>
            </h2>
            <div className="flex flex-col gap-2 p-1">
              {col.cards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-md bg-white p-3 text-sm shadow-sm"
                >
                  {card.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
