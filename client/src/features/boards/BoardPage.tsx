import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { BoardRole, CardDTO, ROLE_RANK } from "@devboard/shared";
import { useBoard } from "./useBoards";
import { useCreateColumn, useMoveCard } from "./useBoardMutations";
import { useBoardRealtime } from "./useBoardRealtime";
import { computeMove } from "./dnd";
import { BoardColumn } from "./components/BoardColumn";
import { CardContent } from "./components/CardItem";
import { CardEditorModal } from "./CardEditorModal";
import { ActivityPanel } from "./components/ActivityPanel";
import { SharePanel } from "./components/SharePanel";
import { LoadingState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { queryClient, queryKeys } from "@/lib/queryClient";

export function BoardPage() {
  const { boardId = "" } = useParams();
  const { data, isLoading, isError, refetch } = useBoard(boardId);
  const createColumn = useCreateColumn(boardId);
  const moveCard = useMoveCard(boardId);

  const [activeCard, setActiveCard] = useState<CardDTO | null>(null);
  const [openCard, setOpenCard] = useState<CardDTO | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");
  const [panel, setPanel] = useState<"share" | "activity" | null>(null);

  // Subscribe to the board's realtime room and reconcile incoming events.
  useBoardRealtime(boardId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (isLoading) return <LoadingState label="Loading board…" />;
  if (isError || !data)
    return <ErrorState message="Couldn't load this board." onRetry={refetch} />;

  const board = data.board;
  const canEdit = ROLE_RANK[board.role] >= ROLE_RANK[BoardRole.EDITOR];

  function findCard(id: string): CardDTO | null {
    for (const col of board.columns) {
      const c = col.cards.find((card) => card.id === id);
      if (c) return c;
    }
    return null;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveCard(findCard(String(e.active.id)));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = e;
    if (!over) return;

    const cardId = String(active.id);
    const overData = over.data.current as
      | { type: string; columnId: string }
      | undefined;

    let toColumnId: string;
    let toIndex: number;

    if (overData?.type === "column") {
      toColumnId = overData.columnId;
      const col = board.columns.find((c) => c.id === toColumnId);
      toIndex = col ? col.cards.length : 0;
    } else if (overData?.type === "card") {
      toColumnId = overData.columnId;
      const col = board.columns.find((c) => c.id === toColumnId);
      toIndex = col ? col.cards.findIndex((c) => c.id === over.id) : 0;
    } else {
      return;
    }

    const result = computeMove(board, cardId, toColumnId, toIndex);
    if (!result) return;

    // Optimistically apply, then persist.
    queryClient.setQueryData(queryKeys.board(boardId), { board: result.board });
    moveCard.mutate({
      cardId,
      toColumnId: result.toColumnId,
      position: result.position,
      optimistic: result.board,
    });
  }

  async function addColumn() {
    if (!columnTitle.trim()) {
      setAddingColumn(false);
      return;
    }
    await createColumn.mutateAsync(columnTitle.trim());
    setColumnTitle("");
    setAddingColumn(false);
  }

  return (
    <div className="flex h-full flex-col">
      <BoardHeader board={board} canEdit={canEdit} onOpenPanel={setPanel} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-1 items-start gap-3 overflow-x-auto p-4 scrollbar-thin">
          {board.columns.map((col) => (
            <BoardColumn
              key={col.id}
              column={col}
              boardId={boardId}
              canEdit={canEdit}
              onOpenCard={setOpenCard}
            />
          ))}

          {canEdit && (
            <div className="w-72 shrink-0">
              {addingColumn ? (
                <div className="space-y-1.5 rounded-lg bg-surface-200/60 p-2">
                  <input
                    autoFocus
                    value={columnTitle}
                    onChange={(e) => setColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addColumn();
                      if (e.key === "Escape") setAddingColumn(false);
                    }}
                    placeholder="Column title…"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={addColumn} loading={createColumn.isPending}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAddingColumn(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-200/50"
                >
                  + Add column
                </button>
              )}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="w-64 rotate-2 rounded-md border border-slate-200 bg-white p-2.5 shadow-lg">
              <CardContent card={activeCard} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {openCard && (
        <CardEditorModal
          board={board}
          card={findCard(openCard.id) ?? openCard}
          canEdit={canEdit}
          onClose={() => setOpenCard(null)}
        />
      )}

      <Drawer
        open={panel === "share"}
        onClose={() => setPanel(null)}
        title="Share board"
      >
        <SharePanel board={board} open={panel === "share"} />
      </Drawer>
      <Drawer
        open={panel === "activity"}
        onClose={() => setPanel(null)}
        title="Activity"
      >
        <ActivityPanel boardId={boardId} open={panel === "activity"} />
      </Drawer>
    </div>
  );
}

function BoardHeader({
  board,
  canEdit,
  onOpenPanel,
}: {
  board: import("@devboard/shared").BoardDetailDTO;
  canEdit: boolean;
  onOpenPanel: (p: "share" | "activity") => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <Link to="/boards" className="text-sm text-slate-500 hover:text-slate-700">
        ← Boards
      </Link>
      <h1 className="font-semibold text-slate-800">{board.title}</h1>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
        {board.role.toLowerCase()}
      </span>
      {!canEdit && (
        <span className="text-xs text-amber-600">View-only access</span>
      )}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex -space-x-2">
          {board.members.slice(0, 5).map((m) => (
            <span
              key={m.userId}
              title={`${m.user.name} (${m.role.toLowerCase()})`}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-xs font-medium text-indigo-700"
            >
              {m.user.name.charAt(0).toUpperCase()}
            </span>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={() => onOpenPanel("activity")}>
          Activity
        </Button>
        <Button size="sm" onClick={() => onOpenPanel("share")}>
          Share
        </Button>
      </div>
    </div>
  );
}
