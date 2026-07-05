import { expect, test, type Page } from "@playwright/test";

const USERNAME = "user";
const PASSWORD = "password";

const login = async (page: Page) => {
  await page.goto("/login");
  await page.fill('input[name="username"]', USERNAME);
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes("/login")),
    page.click('button[type="submit"]'),
  ]);
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
};

const stubBoardChat = async (page: Page, cardTitle: string) => {
  await page.route("**/api/ai/board-chat", async (route) => {
    const request = route.request();
    const body = JSON.parse(request.postData() ?? "{}");
    const historyLength = Array.isArray(body.history) ? body.history.length : 0;

    const nextBoard = {
      columns: [
        { id: "col-backlog", title: "Backlog", cardIds: ["card-1", "card-2", "card-ai-1"] },
        { id: "col-discovery", title: "Discovery", cardIds: ["card-3"] },
        { id: "col-progress", title: "In Progress", cardIds: ["card-4", "card-5"] },
        { id: "col-review", title: "Review", cardIds: ["card-6"] },
        { id: "col-done", title: "Done", cardIds: ["card-7", "card-8"] },
      ],
      cards: {
        "card-1": { id: "card-1", title: "Align roadmap themes", details: "" },
        "card-2": { id: "card-2", title: "Gather customer signals", details: "" },
        "card-3": { id: "card-3", title: "Prototype analytics view", details: "" },
        "card-4": { id: "card-4", title: "Refine status language", details: "" },
        "card-5": { id: "card-5", title: "Design card layout", details: "" },
        "card-6": { id: "card-6", title: "QA micro-interactions", details: "" },
        "card-7": { id: "card-7", title: "Ship marketing page", details: "" },
        "card-8": { id: "card-8", title: "Close onboarding sprint", details: "" },
        "card-ai-1": {
          id: "card-ai-1",
          title: cardTitle,
          details: "added via ai",
        },
      },
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: `Added ${cardTitle} to Backlog. (stubbed, history=${historyLength})`,
        board: nextBoard,
      }),
    });
  });
};

test.describe("AI chat sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await stubBoardChat(page, "AI Test Card");
  });

  test("typing a request adds a card to the board", async ({ page }) => {
    const sidebar = page.getByTestId("chat-sidebar");
    await expect(sidebar).toBeVisible();

    await sidebar.getByTestId("chat-input").fill("Add a card called AI Test Card to Backlog");
    await sidebar.getByTestId("chat-send").click();

    // User bubble appears immediately.
    await expect(sidebar.getByTestId("chat-message-user")).toHaveText(
      "Add a card called AI Test Card to Backlog"
    );

    // Assistant reply bubbles up.
    await expect(sidebar.getByTestId("chat-message-assistant")).toContainText(
      "Added AI Test Card to Backlog"
    );

    // And the card lands on the Backlog column without a reload.
    const backlog = page.getByTestId("column-col-backlog");
    await expect(backlog.getByDisplayValue("AI Test Card")).toBeVisible();
  });
});