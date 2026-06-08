import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ColumnDTO, CardDTO } from "@devboard/shared";
import { CardItem } from "./CardItem";
import { Button } from "@/components/ui/Button";
import {
  useCreateCard,
  useDeleteColumn,
  useRenameColumn,
} from "../useBoardMutations";

interface Props {
  column: ColumnDTO;
  canEdit: boolean;
  boardId: string;
  onOpenCard: (card: CardDTO) => void;
}

export function BoardColumn({ column, canEdit, boardId, onOpenCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });
  const createCard = useCreateCard(boardId);
  const deleteColumn = useDeleteColumn(boardId);
  const renameColumn = useRenameColumn(boardId);

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(column.title);

  async function addCard() {
    if (!newTitle.trim()) {
      setAdding(false);
      return;
    }
    await createCard.mutateAsync({
      columnId: column.id,
      input: { title: newTitle.trim() },
    });
    setNewTitle("");
    setAdding(false);
  }

  function commitRename() {
    setEditingName(false);
    if (name.trim() && name.trim() !== column.title) {
      renameColumn.mutate({ columnId: column.id, title: name.trim() });
    } else {
      setName(column.title);
    }
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-surface-200/60">
      <div className="flex items-center justify-between px-3 py-2">
        {editingName && canEdit ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => e.key === "Enter" && commitRename()}
            className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-sm font-semibold"
          />
        ) : (
          <h2
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
            onDoubleClick={() => canEdit && setEditingName(true)}
          >
            {column.title}
            <span className="rounded bg-slate-300/60 px-1.5 text-xs text-slate-600">
              {column.cards.length}
            </span>
          </h2>
        )}
        {canEdit && !editingName && (
          <button
            onClick={() => {
              if (confirm(`Delete column "${column.title}" and its cards?`))
                deleteColumn.mutate(column.id);
            }}
            className="text-xs text-slate-400 hover:text-red-600"
            title="Delete column"
          >
            ✕
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[2rem] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 scrollbar-thin ${
          isOver ? "bg-indigo-50/50" : ""
        }`}
      >
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              draggable={canEdit}
              onClick={() => onOpenCard(card)}
            />
          ))}
        </SortableContext>

        {adding ? (
          <div className="space-y-1.5">
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addCard();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Card title…"
              className="w-full rounded-md border border-slate-300 p-2 text-sm"
              rows={2}
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={addCard} loading={createCard.isPending}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          canEdit && (
            <button
              onClick={() => setAdding(true)}
              className="rounded-md px-2 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-200/70"
            >
              + Add a card
            </button>
          )
        )}
      </div>
    </div>
  );
}
