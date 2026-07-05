"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  sendBoardChat,
  type BoardChatResponse,
  type ChatMessage,
} from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

type ChatSidebarProps = {
  onBoardUpdate?: (next: BoardData) => void;
};

const SUGGESTION =
  "Ask the AI to add, move, rename, or delete cards. Example: 'Add a card called Smoke to Backlog'.";

export const ChatSidebar = ({ onBoardUpdate }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isSending]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isSending) return;

      const historySnapshot = messages;
      const userTurn: ChatMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userTurn]);
      setInput("");
      setError(null);
      setIsSending(true);

      try {
        const response: BoardChatResponse = await sendBoardChat(
          trimmed,
          historySnapshot
        );
        let reply = response.reply?.trim() || "Done.";
        // Defensive: if the model wrapped the JSON in `reply`, unwrap it.
        if (reply.startsWith("{")) {
          try {
            const inner = JSON.parse(reply) as { reply?: unknown };
            if (typeof inner.reply === "string" && inner.reply.trim()) {
              reply = inner.reply.trim();
            }
          } catch {
            // not JSON — keep raw text
          }
        }
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        if (response.board && onBoardUpdate) {
          onBoardUpdate(response.board);
        }
      } catch (err) {
        console.error("sendBoardChat failed", err);
        setError("AI is unavailable right now. Try again in a moment.");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, the AI is unavailable." },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, messages, onBoardUpdate]
  );

  return (
    <aside
      className="flex w-full flex-col overflow-hidden rounded-3xl border border-[var(--stroke)] bg-white/90 shadow-[var(--shadow)] backdrop-blur lg:w-[360px] lg:shrink-0"
      data-testid="chat-sidebar"
    >
      <header className="flex items-center justify-between gap-3 bg-[var(--navy-dark)] px-5 py-4 text-white">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
            AI Assistant
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">
            Board Chat
          </h2>
        </div>
        <span className="rounded-full bg-[var(--primary-blue)]/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
          Beta
        </span>
      </header>

      <div
        ref={scrollRef}
        className="scroll-soft flex min-h-[260px] flex-1 flex-col gap-3 overflow-y-auto bg-[var(--surface)] px-4 py-4"
        data-testid="chat-history"
      >
        {messages.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-[var(--stroke)] bg-white px-4 py-3 text-xs leading-5 text-[var(--gray-text)]"
            data-testid="chat-empty"
          >
            {SUGGESTION}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              data-testid={`chat-message-${message.role}`}
              className={clsx(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm",
                message.role === "user"
                  ? "self-end bg-[var(--primary-blue)] text-white"
                  : "self-start border border-[var(--stroke)] bg-white text-[var(--navy-dark)]"
              )}
            >
              {message.content}
            </div>
          ))
        )}
        {isSending ? (
          <div
            className="self-start rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
            data-testid="chat-status"
          >
            Thinking...
          </div>
        ) : null}
        {error ? (
          <p
            className="text-xs font-semibold text-[var(--secondary-purple)]"
            data-testid="chat-error"
          >
            {error}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-[var(--stroke)] bg-white px-4 py-3"
      >
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
            Message
          </span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask the AI to update the board..."
            rows={2}
            disabled={isSending}
            data-testid="chat-input"
            className="resize-none rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)] disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          data-testid="chat-send"
          className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </aside>
  );
};