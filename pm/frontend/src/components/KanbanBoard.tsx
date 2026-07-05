"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { ChatSidebar } from "@/components/ChatSidebar";
import { createId, moveCard, type BoardData } from "@/lib/kanban";
import { debounce, fetchBoard, saveBoard } from "@/lib/api";

const SAVE_DELAY_MS = 300;

export const KanbanBoard = () => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const persist = useCallback(async (next: BoardData) => {
    try {
      const truth = await saveBoard(next);
      setBoard(truth);
    } catch (err) {
      console.error("saveBoard failed, refetching", err);
      try {
        const truth = await fetchBoard();
        setBoard(truth);
      } catch (refetchErr) {
        console.error("refetch also failed", refetchErr);
      }
    }
  }, []);

  const scheduleSave = useMemo(
    () => debounce((next: BoardData) => void persist(next), SAVE_DELAY_MS),
    [persist]
  );

  useEffect(() => {
    let cancelled = false;
    fetchBoard()
      .then((data) => {
        if (!cancelled) setBoard(data);
      })
      .catch((err) => {
        if (!cancelled) console.error("fetchBoard failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cardsById = board?.cards ?? null;

  const mutate = useCallback(
    (updater: (prev: BoardData) => BoardData) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  // The AI endpoint already persists; we only need to mirror its result into
  // local state — no second PATCH.
  const applyBoardFromAi = useCallback((next: BoardData) => {
    setBoard(next);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) {
      return;
    }

    mutate((prev) => ({
      ...prev,
      columns: moveCard(prev.columns, active.id as string, over.id as string),
    }));
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    mutate((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    mutate((prev) => {
      const id = createId("card");
      return {
        ...prev,
        cards: {
          ...prev.cards,
          [id]: { id, title, details: details || "No details yet." },
        },
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? { ...column, cardIds: [...column.cardIds, id] }
            : column
        ),
      };
    });
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    mutate((prev) => ({
      ...prev,
      cards: Object.fromEntries(
        Object.entries(prev.cards).filter(([id]) => id !== cardId)
      ),
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: column.cardIds.filter((id) => id !== cardId) }
          : column
      ),
    }));
  };

  const handleEditCard = (
    cardId: string,
    patch: { title: string; details: string }
  ) => {
    mutate((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardId]: { ...prev.cards[cardId], ...patch },
      },
    }));
  };

  const activeCard = activeCardId && cardsById ? cardsById[activeCardId] : null;

  if (!board) {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-[1500px] items-center justify-center px-6">
        <p
          className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]"
          data-testid="board-loading"
        >
          Loading board...
        </p>
      </main>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 pb-16 pt-12 lg:flex-row">
        <main className="flex min-w-0 flex-1 flex-col gap-10">
          <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                  Single Board Kanban
                </p>
                <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]">
                  Kanban Studio
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
                  Keep momentum visible. Rename columns, drag cards between stages,
                  and capture quick notes without getting buried in settings.
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
                    Focus
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--primary-blue)]">
                    One board. Five columns. Zero clutter.
                  </p>
                </div>
                <form method="post" action="/logout">
                  <button
                    type="submit"
                    className="rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)] transition hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)]"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {board.columns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]"
                >
                  <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
                  {column.title}
                </div>
              ))}
            </div>
          </header>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <section className="scroll-soft grid grid-flow-col auto-cols-[300px] gap-6 overflow-x-auto pb-4 lg:auto-cols-[340px]">
              {board.columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={column.cardIds.map((cardId) => board.cards[cardId])}
                  onRename={handleRenameColumn}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                  onEditCard={handleEditCard}
                />
              ))}
            </section>
            <DragOverlay>
              {activeCard ? (
                <div className="w-[260px]">
                  <KanbanCardPreview card={activeCard} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>

        <ChatSidebar onBoardUpdate={applyBoardFromAi} />
      </div>
    </div>
  );
};
