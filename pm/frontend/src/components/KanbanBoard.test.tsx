import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KanbanBoard } from "@/components/KanbanBoard";
import type { BoardData } from "@/lib/kanban";

const seededBoard: BoardData = {
  columns: [
    { id: "col-a", title: "A", cardIds: ["card-1", "card-2"] },
    { id: "col-b", title: "B", cardIds: ["card-3"] },
  ],
  cards: {
    "card-1": { id: "card-1", title: "Card 1", details: "First" },
    "card-2": { id: "card-2", title: "Card 2", details: "Second" },
    "card-3": { id: "card-3", title: "Card 3", details: "Third" },
  },
};

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response;

const installFetchMock = (board: BoardData) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === "/api/board") {
      return jsonResponse(board);
    }
    if (url === "/api/ai/board-chat") {
      return jsonResponse({ reply: "", board });
    }
    throw new Error(`Unhandled fetch in test: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const waitForBoard = async () => {
  await waitFor(() =>
    expect(screen.queryByTestId("board-loading")).not.toBeInTheDocument()
  );
};

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];

describe("KanbanBoard", () => {
  beforeEach(() => {
    installFetchMock(seededBoard);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders columns loaded from the API", async () => {
    render(<KanbanBoard />);
    await waitForBoard();
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(2);
    expect(screen.getByDisplayValue("Card 1")).toBeInTheDocument();
  });

  it("renames a column locally", async () => {
    const user = userEvent.setup();
    render(<KanbanBoard />);
    await waitForBoard();
    const column = getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await user.clear(input);
    await user.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard />);
    await waitForBoard();
    const column = getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: /add a card/i,
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(
      within(column).getByRole("button", { name: /add card/i })
    );

    expect(within(column).getByDisplayValue("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(
      within(column).queryByDisplayValue("New card")
    ).not.toBeInTheDocument();
  });

  it("saves pending board edits before sending an AI request", async () => {
    const calls: string[] = [];
    let persistedBoard = seededBoard;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "/api/board" && init?.method === "PATCH") {
          persistedBoard = JSON.parse(init.body as string) as BoardData;
          calls.push(`save:${persistedBoard.columns[0].title}`);
          return jsonResponse(persistedBoard);
        }
        if (url === "/api/board") {
          return jsonResponse(persistedBoard);
        }
        if (url === "/api/ai/board-chat") {
          calls.push("ai");
          return jsonResponse({ reply: "Done.", board: persistedBoard });
        }
        throw new Error(`Unhandled fetch in test: ${url}`);
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<KanbanBoard />);
    await waitForBoard();

    const column = getFirstColumn();
    const titleInput = within(column).getByLabelText("Column title");
    await user.clear(titleInput);
    await user.type(titleInput, "Ready");

    await user.type(
      screen.getByTestId("chat-input"),
      "Add a card after saving"
    );
    await user.click(screen.getByTestId("chat-send"));

    await waitFor(() =>
      expect(screen.getByTestId("chat-message-assistant")).toHaveTextContent(
        "Done."
      )
    );
    expect(calls).toEqual(["save:Ready", "ai"]);
  });
});
