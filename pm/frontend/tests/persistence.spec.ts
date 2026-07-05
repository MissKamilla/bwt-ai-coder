import { expect, test, type Page } from "@playwright/test";

const USERNAME = "user";
const PASSWORD = "password";

const seedBoard = {
  columns: [
    { id: "col-backlog", title: "Backlog", cardIds: ["card-1", "card-2"] },
    { id: "col-discovery", title: "Discovery", cardIds: ["card-3"] },
    {
      id: "col-progress",
      title: "In Progress",
      cardIds: ["card-4", "card-5"],
    },
    { id: "col-review", title: "Review", cardIds: ["card-6"] },
    { id: "col-done", title: "Done", cardIds: ["card-7", "card-8"] },
  ],
  cards: {
    "card-1": {
      id: "card-1",
      title: "Align roadmap themes",
      details: "Draft quarterly themes with impact statements and metrics.",
    },
    "card-2": {
      id: "card-2",
      title: "Gather customer signals",
      details: "Review support tags, sales notes, and churn feedback.",
    },
    "card-3": {
      id: "card-3",
      title: "Prototype analytics view",
      details: "Sketch initial dashboard layout and key drill-downs.",
    },
    "card-4": {
      id: "card-4",
      title: "Refine status language",
      details: "Standardize column labels and tone across the board.",
    },
    "card-5": {
      id: "card-5",
      title: "Design card layout",
      details: "Add hierarchy and spacing for scanning dense lists.",
    },
    "card-6": {
      id: "card-6",
      title: "QA micro-interactions",
      details: "Verify hover, focus, and loading states.",
    },
    "card-7": {
      id: "card-7",
      title: "Ship marketing page",
      details: "Final copy approved and asset pack delivered.",
    },
    "card-8": {
      id: "card-8",
      title: "Close onboarding sprint",
      details: "Document release notes and share internally.",
    },
  },
};

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

const uniqueTitle = () => `Persistence ${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

const resetBoard = async (page: Page) => {
  const response = await page.evaluate(async (board) => {
    const r = await fetch("/api/board", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(board),
    });
    return { ok: r.ok, status: r.status, text: await r.text() };
  }, seedBoard);
  expect(response.ok, response.text).toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
};

const waitForBoardSave = (page: Page, expectedBodyText?: string) =>
  page.waitForResponse(async (response) => {
    if (!response.url().endsWith("/api/board")) return false;
    if (response.request().method() !== "PATCH") return false;
    if (!response.ok()) return false;
    if (!expectedBodyText) return true;
    return response.request().postData()?.includes(expectedBodyText) ?? false;
  });

test.describe("Kanban persistence across reload", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await resetBoard(page);
  });

  test("a created card survives a reload", async ({ page }) => {
    const firstColumn = page.locator('[data-testid^="column-"]').first();
    await firstColumn.getByRole("button", { name: /add a card/i }).click();
    const title = uniqueTitle();
    await firstColumn.getByPlaceholder("Card title").fill(title);
    await firstColumn.getByPlaceholder("Details").fill("Persisted via reload");
    const saved = waitForBoardSave(page, title);
    await firstColumn.getByRole("button", { name: /add card/i }).click();

    await expect(firstColumn.getByLabel("Card title").last()).toHaveValue(title);
    await saved;

    await page.reload();

    await expect(
      page.locator('[data-testid^="column-"]').first().getByLabel("Card title").last()
    ).toHaveValue(title);
  });

  test("column rename survives a reload", async ({ page }) => {
    const firstColumn = page.locator('[data-testid^="column-"]').first();
    const input = firstColumn.getByLabel("Column title");
    const newName = `Renamed-${Date.now()}`;
    const saved = waitForBoardSave(page, newName);
    await input.fill(newName);
    await expect(input).toHaveValue(newName);
    await saved;

    await page.reload();

    await expect(
      page
        .locator('[data-testid^="column-"]')
        .first()
        .getByLabel("Column title")
    ).toHaveValue(newName);
  });

  test.skip("a dragged card keeps its new column after reload", async ({ page }) => {
    const dragHandle = page.getByTestId("drag-handle-card-1");
    const sourceColumn = page.locator('[data-testid^="column-"]').first();
    await expect(sourceColumn.getByTestId("card-card-1")).toBeVisible();

    const targetColumn = page.getByTestId("column-col-discovery");
    const columnBox = await targetColumn.boundingBox();
    if (!columnBox) {
      throw new Error("Unable to resolve drag coordinates.");
    }

    const saved = waitForBoardSave(page, "card-1");
    const handleBox = await dragHandle.boundingBox();
    if (!handleBox) {
      throw new Error("Unable to resolve drag handle coordinates.");
    }
    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 12, startY + 12);
    await page.mouse.move(
      columnBox.x + columnBox.width / 2,
      columnBox.y + columnBox.height - 40,
      { steps: 20 }
    );
    await page.mouse.up();

    await expect(targetColumn.getByTestId("card-card-1")).toBeVisible();
    await saved;

    await page.reload();

    await expect(page.getByTestId("column-col-discovery").getByTestId("card-card-1")).toBeVisible();
  });

  test("an edited card title survives a reload", async ({ page }) => {
    const card = page.getByTestId("card-card-1");
    const titleInput = card.getByLabel("Card title");
    const newTitle = `Edited ${Date.now()}`;
    const saved = waitForBoardSave(page, newTitle);
    await titleInput.fill(newTitle);
    await expect(titleInput).toHaveValue(newTitle);
    await saved;

    await page.reload();

    await expect(
      page.getByTestId("card-card-1").getByLabel("Card title")
    ).toHaveValue(newTitle);
  });
});
