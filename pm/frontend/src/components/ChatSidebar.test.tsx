import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatSidebar } from "@/components/ChatSidebar";
import type { BoardData } from "@/lib/kanban";

const baseBoard: BoardData = {
  columns: [
    { id: "col-a", title: "A", cardIds: ["card-1"] },
  ],
  cards: {
    "card-1": { id: "card-1", title: "Card 1", details: "First" },
  },
};

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response;

describe("ChatSidebar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the empty state with a suggestion", () => {
    render(<ChatSidebar />);
    expect(screen.getByTestId("chat-empty")).toBeInTheDocument();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
    expect(screen.getByTestId("chat-send")).toBeDisabled();
  });

  it("sends a message, renders the assistant reply, and calls onBoardUpdate", async () => {
    const nextBoard: BoardData = {
      columns: [
        { id: "col-a", title: "A", cardIds: ["card-1", "card-2"] },
      ],
      cards: {
        "card-1": { id: "card-1", title: "Card 1", details: "First" },
        "card-2": { id: "card-2", title: "AI Card", details: "added" },
      },
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/ai/board-chat") {
        return jsonResponse({ reply: "Added a card.", board: nextBoard });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const onBoardUpdate = vi.fn();
    const user = userEvent.setup();
    render(<ChatSidebar onBoardUpdate={onBoardUpdate} />);

    const input = screen.getByTestId("chat-input");
    await user.type(input, "Add a card called AI Card");
    expect(screen.getByTestId("chat-send")).toBeEnabled();

    await user.click(screen.getByTestId("chat-send"));

    expect(screen.getByTestId("chat-message-user")).toHaveTextContent(
      "Add a card called AI Card"
    );

    await waitFor(() =>
      expect(screen.getByTestId("chat-message-assistant")).toHaveTextContent(
        "Added a card."
      )
    );

    expect(onBoardUpdate).toHaveBeenCalledWith(nextBoard);

    const lastCall = fetchMock.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const body = JSON.parse((lastCall![1] as RequestInit).body as string);
    expect(body).toEqual({
      user_message: "Add a card called AI Card",
      history: [],
    });
  });

  it("shows an error message when the API fails", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: "boom" }, 503)
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ChatSidebar />);

    await user.type(screen.getByTestId("chat-input"), "hi");
    await user.click(screen.getByTestId("chat-send"));

    await waitFor(() =>
      expect(screen.getByTestId("chat-error")).toBeInTheDocument()
    );
    expect(screen.getAllByTestId("chat-message-assistant").at(-1)).toHaveTextContent(
      "Sorry, the AI is unavailable."
    );
  });
});

describe("KanbanBoard renders ChatSidebar", () => {
  beforeEach(() => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/board") return jsonResponse(baseBoard);
      if (url === "/api/ai/board-chat")
        return jsonResponse({ reply: "", board: baseBoard });
      throw new Error(`Unhandled fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mounts the chat sidebar alongside the board", async () => {
    const { KanbanBoard } = await import("@/components/KanbanBoard");
    render(<KanbanBoard />);
    await waitFor(() =>
      expect(screen.queryByTestId("board-loading")).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("chat-sidebar")).toBeInTheDocument();
  });
});