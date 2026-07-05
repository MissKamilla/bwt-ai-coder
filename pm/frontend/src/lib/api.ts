import type { BoardData } from "@/lib/kanban";

export const fetchBoard = async (): Promise<BoardData> => {
  const response = await fetch("/api/board", {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to load board: ${response.status}`);
  }
  return (await response.json()) as BoardData;
};

export const saveBoard = async (board: BoardData): Promise<BoardData> => {
  const response = await fetch("/api/board", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(board),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to save board: ${response.status} ${text}`);
  }
  return (await response.json()) as BoardData;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type BoardChatResponse = {
  reply: string;
  board: BoardData;
};

export const sendBoardChat = async (
  userMessage: string,
  history: ChatMessage[]
): Promise<BoardChatResponse> => {
  const response = await fetch("/api/ai/board-chat", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ user_message: userMessage, history }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to chat: ${response.status} ${text}`);
  }
  return (await response.json()) as BoardChatResponse;
};

export const debounce = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number
) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
};
