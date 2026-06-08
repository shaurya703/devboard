import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardDTO } from "@devboard/shared";
import { cn } from "@/lib/cn";
import { formatDueDate, isOverdue } from "../format";

interface Props {
  card: CardDTO;
  onClick: () => void;
  draggable: boolean;
}

/** A single sortable card. Presentational content is shared with DragOverlay. */
export function CardItem({ card, onClick, draggable }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", columnId: card.columnId },
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md border border-slate-200 bg-white p-2.5 text-sm shadow-sm transition hover:border-slate-300",
        isDragging && "opacity-40",
        draggable && "active:cursor-grabbing"
      )}
    >
      <CardContent card={card} />
    </div>
  );
}

/** Card body, reused by CardItem and the DragOverlay. */
export function CardContent({ card }: { card: CardDTO }) {
  const overdue = isOverdue(card.dueDate);
  return (
    <div className="space-y-2">
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((l) => (
            <span
              key={l.id}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: l.color }}
              title={l.name}
            />
          ))}
        </div>
      )}
      <p className="font-medium text-slate-800">{card.title}</p>
      <div className="flex items-center justify-between">
        {card.dueDate ? (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px]",
              overdue
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {formatDueDate(card.dueDate)}
          </span>
        ) : (
          <span />
        )}
        {card.assignee && (
          <span
            title={card.assignee.name}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-medium text-indigo-700"
          >
            {card.assignee.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
