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

test.describe("Kanban board", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("loads the kanban board", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
    await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
  });

  test("adds a card to a column", async ({ page }) => {
    const firstColumn = page.locator('[data-testid^="column-"]').first();
    await firstColumn.getByRole("button", { name: /add a card/i }).click();
    await firstColumn.getByPlaceholder("Card title").fill("Playwright card");
    await firstColumn.getByPlaceholder("Details").fill("Added via e2e.");
    await firstColumn.getByRole("button", { name: /add card/i }).click();
    await expect(firstColumn.getByLabel("Card title").last()).toHaveValue(
      "Playwright card"
    );
  });

  test.skip("moves a card between columns", async ({ page }) => {
    const dragHandle = page.getByTestId("drag-handle-card-1");
    const targetColumn = page.getByTestId("column-col-discovery");
    const columnBox = await targetColumn.boundingBox();
    if (!columnBox) {
      throw new Error("Unable to resolve drag coordinates.");
    }

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
  });
});
