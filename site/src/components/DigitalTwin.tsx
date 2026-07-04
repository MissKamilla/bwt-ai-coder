'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type Status = 'idle' | 'streaming' | 'error';

const SUGGESTIONS = [
  'What is Kamila strongest at right now?',
  'Walk me through her latest project.',
  'Is she open to remote roles?',
  'What stack does she reach for daily?',
];

const STORAGE_KEY = 'kamila-twin-messages-v1';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function DigitalTwin() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load history once
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed.filter((m) => m && m.role && typeof m.content === 'string'));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist history
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  // Mark unread when a response arrives while chat is closed
  useEffect(() => {
    if (!open && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') setHasUnread(true);
    }
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || status === 'streaming') return;

      const userMsg: Message = { id: uid(), role: 'user', content: trimmed };
      const assistantId = uid();
      const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' };

      setMessages((m) => [...m, userMsg, assistantMsg]);
      setInput('');
      setStatus('streaming');
      setErrorMsg(null);

      // Build the history to send (everything except the empty assistant placeholder)
      const historyForApi = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyForApi }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let detail = '';
          try {
            const errBody = await res.json();
            detail = errBody?.error || errBody?.detail || '';
          } catch {
            /* ignore */
          }
          throw new Error(detail || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          // Snapshot the accumulated string so React state stays consistent
          const snapshot = acc;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m))
          );
        }

        setStatus('idle');
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setStatus('idle');
          return;
        }
        const msg = (err as Error).message || 'Something went wrong.';
        setErrorMsg(msg);
        setStatus('error');
        // Replace the empty assistant placeholder with an error bubble
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    m.content ||
                    "Hmm, I couldn't reach the model just now. Please try again in a moment.",
                }
              : m
          )
        );
      } finally {
        abortRef.current = null;
      }
    },
    [input, messages, status]
  );

  const stop = () => {
    abortRef.current?.abort();
  };

  const clearHistory = () => {
    if (status === 'streaming') return;
    setMessages([]);
    setErrorMsg(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 220, damping: 18 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 group"
        aria-label="Open Digital Twin chat"
      >
        <div className="relative w-14 h-14 rounded-full bg-ink-950 border border-accent/40 flex items-center justify-center shadow-lg shadow-accent/10 hover:shadow-accent/30 hover:border-accent transition-all">
          <div className="absolute inset-0 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors" />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="relative text-accent">
            <path
              d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="12" r="1" fill="currentColor" />
            <circle cx="13" cy="12" r="1" fill="currentColor" />
            <circle cx="17" cy="12" r="1" fill="currentColor" />
          </svg>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-coral status-dot text-coral" />
          )}
          {!open && (
            <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-ink-950 border border-white/10 px-3 py-1.5 text-xs font-mono text-ink-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Ask the Digital Twin →
            </span>
          )}
        </div>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="twin-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[min(92vw,420px)] h-[min(80vh,640px)] max-h-[80vh] flex flex-col rounded-xl border border-white/10 bg-ink-950/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
            role="dialog"
            aria-label="Digital Twin chat"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-b from-ink-900/80 to-ink-950">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0 w-9 h-9 rounded-md bg-gradient-to-br from-accent to-coral flex items-center justify-center">
                  <span className="font-display font-bold text-ink-950 text-sm">K</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-ink-950 ring-2 ring-accent" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-sm text-ink-50 truncate">
                      Kamila Twin
                    </h3>
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-accent status-dot text-accent" />
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                    {status === 'streaming' ? 'Thinking…' : 'Online · OpenRouter'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearHistory}
                  disabled={messages.length === 0 || status === 'streaming'}
                  className="text-[10px] font-mono uppercase tracking-widest text-ink-400 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded transition-colors"
                  title="Clear conversation"
                >
                  Clear
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/5 text-ink-300 hover:text-white"
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <EmptyState onSuggest={(s) => send(s)} />
              ) : (
                messages.map((m, i) => (
                  <Bubble key={m.id} msg={m} isLast={i === messages.length - 1} />
                ))
              )}
              {errorMsg && (
                <div className="rounded-md border border-coral/40 bg-coral/5 px-3 py-2 text-xs text-coral-400 font-mono">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Suggestions row (only when empty) */}
            {messages.length === 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] font-mono px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-ink-200 hover:border-accent/40 hover:text-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-white/10 p-3 bg-ink-950">
              <div className="flex items-end gap-2 rounded-lg border border-white/10 bg-ink-900/60 focus-within:border-accent/50 transition-colors px-3 py-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about Kamila's stack, projects, availability…"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-500 resize-none outline-none max-h-32"
                  style={{ minHeight: '24px' }}
                />
                {status === 'streaming' ? (
                  <button
                    onClick={stop}
                    className="shrink-0 w-8 h-8 rounded-md bg-coral/20 border border-coral/40 text-coral-400 flex items-center justify-center hover:bg-coral/30 transition-colors"
                    aria-label="Stop"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <rect width="10" height="10" rx="1" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => send()}
                    disabled={!input.trim()}
                    className="shrink-0 w-8 h-8 rounded-md bg-accent text-ink-950 flex items-center justify-center hover:bg-accent-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 7h10m0 0L8 3m4 4l-4 4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-ink-500 px-1">
                <span>⏎ send · ⇧⏎ newline · esc close</span>
                <span className="text-ink-600">Powered by OpenRouter</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (s: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-coral flex items-center justify-center mb-4 glow-accent">
        <span className="font-display font-bold text-ink-950 text-xl">K</span>
      </div>
      <h4 className="font-display text-lg font-semibold text-ink-50 mb-1">
        Hey — I'm Kamila's digital twin.
      </h4>
      <p className="text-sm text-ink-300 max-w-[300px] leading-relaxed mb-4">
        Ask me anything about her stack, projects, or what she's looking for next.
        I'll answer as she would.
      </p>
      <p className="text-[10px] font-mono uppercase tracking-widest text-ink-500">
        Try one of these ↓
      </p>
    </div>
  );
}

function Bubble({ msg, isLast }: { msg: Message; isLast: boolean }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent text-ink-950 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-7 h-7 rounded-md bg-gradient-to-br from-accent to-coral flex items-center justify-center text-[11px] font-display font-bold text-ink-950">
        K
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/10 text-ink-100 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
        {msg.content || (
          <span className="inline-flex items-center gap-1 text-ink-400">
            <Dot delay={0} />
            <Dot delay={0.15} />
            <Dot delay={0.3} />
          </span>
        )}
        {isLast && msg.content && (
          <span className="inline-block w-1.5 h-3.5 bg-accent ml-1 align-middle animate-blink" />
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}