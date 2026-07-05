import { useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
  onEdit: (cardId: string, patch: { title: string; details: string }) => void;
};

export const KanbanCard = ({ card, onDelete, onEdit }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });
  const detailsRef = useRef<HTMLTextAreaElement | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [card.details]);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "rounded-2xl border border-transparent bg-white px-4 py-4 shadow-[0_12px_24px_rgba(3,33,71,0.08)]",
        "transition-all duration-150",
        isDragging && "opacity-60 shadow-[0_18px_32px_rgba(3,33,71,0.16)]"
      )}
      data-testid={`card-${card.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Drag ${card.title}`}
          data-testid={`drag-handle-${card.id}`}
          className="mt-1 cursor-grab rounded border border-transparent px-1.5 py-1 text-xs font-semibold text-[var(--gray-text)] transition hover:border-[var(--stroke)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          Grip
        </button>
        <div className="w-full">
          <input
            value={card.title}
            onChange={(event) =>
              onEdit(card.id, { title: event.target.value, details: card.details })
            }
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Card title"
            className="w-full bg-transparent font-display text-base font-semibold text-[var(--navy-dark)] outline-none"
          />
          <textarea
            ref={detailsRef}
            value={card.details}
            onChange={(event) =>
              onEdit(card.id, { title: card.title, details: event.target.value })
            }
            onPointerDown={(event) => event.stopPropagation()}
            rows={1}
            aria-label="Card details"
            style={{ resize: "none", overflow: "hidden" }}
            className="mt-2 block w-full border-0 bg-transparent text-sm leading-6 text-[var(--gray-text)] outline-none"
          />
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(card.id);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="rounded-full border border-transparent px-2 py-1 text-xs font-semibold text-[var(--gray-text)] transition hover:border-[var(--stroke)] hover:text-[var(--navy-dark)]"
          aria-label={`Delete ${card.title}`}
        >
          Remove
        </button>
      </div>
    </article>
  );
};
