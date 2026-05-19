import { test, expect, Page } from "@playwright/test";

async function loginAs(page: Page) {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/org\//, { timeout: 15_000 });
}

test.describe("Projects", () => {
    test.beforeEach(async ({ page }) => {
        if (!process.env.E2E_TEST_EMAIL) test.skip();
    });

    test("projects page renders", async ({ page }) => {
        await loginAs(page);
        await page.getByRole("link", { name: /projects/i }).click();
        await expect(page).toHaveURL(/projects/);
        await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();
    });

    test("create project dialog opens", async ({ page }) => {
        await loginAs(page);
        await page.goto("/");
        await page.getByRole("button", { name: /new project|create project/i }).first().click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
        await expect(page.getByLabel(/project name/i)).toBeVisible();
    });

    test("create a new project", async ({ page }) => {
        await loginAs(page);
        await page.goto("/");
        await page.getByRole("button", { name: /new project|create project/i }).first().click();
        const projectName = `E2E Project ${Date.now()}`;
        await page.getByLabel(/project name/i).fill(projectName);
        await page.getByRole("button", { name: /^create/i }).click();
        await expect(page.getByText(projectName)).toBeVisible({ timeout: 10_000 });
    });

    test("command palette opens with Cmd+K", async ({ page }) => {
        await loginAs(page);
        await page.keyboard.press("Meta+k");
        await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 5_000 });
    });
});
