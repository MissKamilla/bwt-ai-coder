import { expect, test } from "@playwright/test";

const USERNAME = "user";
const PASSWORD = "password";

const login = async (page: import("@playwright/test").Page) => {
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

test.describe("Kanban persistence across reload", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("a created card survives a reload", async ({ page }) => {
    const firstColumn = page.locator('[data-testid^="column-"]').first();
    await firstColumn.getByRole("button", { name: /add a card/i }).click();
    const title = uniqueTitle();
    await firstColumn.getByPlaceholder("Card title").fill(title);
    await firstColumn.getByPlaceholder("Details").fill("Persisted via reload");
    await firstColumn.getByRole("button", { name: /add card/i }).click();

    await expect(firstColumn.getByDisplayValue(title)).toBeVisible();

    await page.reload();

    await expect(
      page.locator('[data-testid^="column-"]').first().getByDisplayValue(title)
    ).toBeVisible();
  });

  test("column rename survives a reload", async ({ page }) => {
    const firstColumn = page.locator('[data-testid^="column-"]').first();
    const input = firstColumn.getByLabel("Column title");
    const newName = `Renamed-${Date.now()}`;
    await input.fill(newName);
    await expect(input).toHaveValue(newName);

    await page.reload();

    await expect(
      page
        .locator('[data-testid^="column-"]')
        .first()
        .getByLabel("Column title")
    ).toHaveValue(newName);
  });

  test("a dragged card keeps its new column after reload", async ({ page }) => {
    const card = page.getByTestId("card-card-1");
    const sourceColumn = page.locator('[data-testid^="column-"]').first();
    await expect(sourceColumn.getByTestId("card-card-1")).toBeVisible();

    const targetColumn = page.getByTestId("column-col-review");
    const cardBox = await card.boundingBox();
    const columnBox = await targetColumn.boundingBox();
    if (!cardBox || !columnBox) {
      throw new Error("Unable to resolve drag coordinates.");
    }

    await page.mouse.move(
      cardBox.x + cardBox.width / 2,
      cardBox.y + cardBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      columnBox.x + columnBox.width / 2,
      columnBox.y + 120,
      { steps: 12 }
    );
    await page.mouse.up();

    await expect(targetColumn.getByTestId("card-card-1")).toBeVisible();

    await page.reload();

    await expect(page.getByTestId("column-col-review").getByTestId("card-card-1")).toBeVisible();
  });

  test("an edited card title survives a reload", async ({ page }) => {
    const card = page.getByTestId("card-card-1");
    const titleInput = card.getByLabel("Card title");
    const newTitle = `Edited ${Date.now()}`;
    await titleInput.fill(newTitle);
    await expect(titleInput).toHaveValue(newTitle);

    await page.reload();

    await expect(
      page.getByTestId("card-card-1").getByLabel("Card title")
    ).toHaveValue(newTitle);
  });
});
