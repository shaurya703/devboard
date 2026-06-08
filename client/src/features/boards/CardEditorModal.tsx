import { useState } from "react";
import { BoardDetailDTO, CardDTO } from "@devboard/shared";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  useUpdateCard,
  useDeleteCard,
  useCreateLabel,
} from "./useBoardMutations";
import { toast } from "@/stores/uiStore";

const LABEL_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

interface Props {
  board: BoardDetailDTO;
  card: CardDTO;
  canEdit: boolean;
  onClose: () => void;
}

/** Helpers to convert between ISO datetime and a yyyy-mm-dd date input. */
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const toIso = (date: string) =>
  date ? new Date(date + "T00:00:00.000Z").toISOString() : null;

export function CardEditorModal({ board, card, canEdit, onClose }: Props) {
  const update = useUpdateCard(board.id);
  const remove = useDeleteCard(board.id);
  const createLabel = useCreateLabel(board.id);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [dueDate, setDueDate] = useState(toDateInput(card.dueDate));
  const [assigneeId, setAssigneeId] = useState(card.assigneeId ?? "");
  const [labelIds, setLabelIds] = useState<string[]>(
    card.labels.map((l) => l.id)
  );
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[3]);

  const toggleLabel = (id: string) =>
    setLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );

  async function onSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await update.mutateAsync({
        cardId: card.id,
        input: {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: toIso(dueDate),
          assigneeId: assigneeId || null,
          labelIds,
        },
      });
      toast.success("Card saved");
      onClose();
    } catch {
      /* handled by mutation onError */
    }
  }

  async function onDelete() {
    if (!confirm("Delete this card?")) return;
    await remove.mutateAsync(card.id);
    onClose();
  }

  async function onCreateLabel() {
    if (!newLabel.trim()) return;
    const res = await createLabel.mutateAsync({
      name: newLabel.trim(),
      color: newColor,
    });
    setLabelIds((prev) => [...prev, res.label.id]);
    setNewLabel("");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={canEdit ? "Edit card" : "Card details"}
      footer={
        canEdit ? (
          <>
            <Button variant="danger" onClick={onDelete} loading={remove.isPending}>
              Delete
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave} loading={update.isPending}>
              Save
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
        />
        <Textarea
          label="Description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canEdit}
          placeholder="Add more detail…"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Due date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={!canEdit}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {board.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Labels
          </label>
          <div className="flex flex-wrap gap-2">
            {board.labels.map((l) => {
              const active = labelIds.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => canEdit && toggleLabel(l.id)}
                  disabled={!canEdit}
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-white transition"
                  style={{ backgroundColor: l.color, opacity: active ? 1 : 0.4 }}
                >
                  {l.name}
                </button>
              );
            })}
            {board.labels.length === 0 && (
              <span className="text-xs text-slate-400">No labels yet.</span>
            )}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 pt-1">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="New label"
                className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
              <div className="flex gap-1">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="h-5 w-5 rounded-full border-2"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? "#1e293b" : "transparent",
                    }}
                  />
                ))}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={onCreateLabel}
                loading={createLabel.isPending}
              >
                Add
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
