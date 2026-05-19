import { test, expect, Page } from "@playwright/test";

// Helper: login before kanban tests (assumes test user exists in Supabase)
async function loginAs(page: Page) {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/org\//, { timeout: 15_000 });
}

test.describe("Kanban Board", () => {
    test.beforeEach(async ({ page }) => {
        // Skip if no test credentials provided
        if (!process.env.E2E_TEST_EMAIL) test.skip();
    });

    test("kanban board renders columns", async ({ page }) => {
        await loginAs(page);
        // Navigate to first project's board
        await page.getByTestId("project-link").first().click();
        await expect(page.getByTestId("kanban-board")).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(/backlog/i)).toBeVisible();
        await expect(page.getByText(/to do/i)).toBeVisible();
        await expect(page.getByText(/in progress/i)).toBeVisible();
        await expect(page.getByText(/done/i)).toBeVisible();
    });

    test("create task dialog opens with shortcut N", async ({ page }) => {
        await loginAs(page);
        await page.getByTestId("project-link").first().click();
        await page.waitForSelector("[data-testid='kanban-board']", { timeout: 10_000 });
        await page.keyboard.press("n");
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
        await expect(page.getByLabel(/task title/i)).toBeVisible();
    });

    test("create task from dialog", async ({ page }) => {
        await loginAs(page);
        await page.getByTestId("project-link").first().click();
        await page.waitForSelector("[data-testid='kanban-board']", { timeout: 10_000 });
        await page.keyboard.press("n");
        const taskTitle = `E2E Task ${Date.now()}`;
        await page.getByLabel(/task title/i).fill(taskTitle);
        await page.getByRole("button", { name: /create/i }).click();
        await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });
    });
});
