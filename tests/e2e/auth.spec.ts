import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "test@nexusflow-e2e.dev";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "TestPassword123!";

test.describe("Authentication", () => {
    test("login page renders correctly", async ({ page }) => {
        await page.goto("/login");
        await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("shows validation errors on empty submit", async ({ page }) => {
        await page.goto("/login");
        await page.getByRole("button", { name: /sign in/i }).click();
        await expect(page.getByText(/email/i)).toBeVisible();
    });

    test("shows error for invalid credentials", async ({ page }) => {
        await page.goto("/login");
        await page.getByLabel(/email/i).fill("invalid@test.com");
        await page.getByLabel(/password/i).fill("wrongpass");
        await page.getByRole("button", { name: /sign in/i }).click();
        await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 10_000 });
    });

    test("register page renders correctly", async ({ page }) => {
        await page.goto("/register");
        await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
        await expect(page.getByLabel(/full name/i)).toBeVisible();
    });

    test("forgot password page renders correctly", async ({ page }) => {
        await page.goto("/forgot-password");
        await expect(page.getByRole("heading", { name: /forgot/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test("navigates from login to register", async ({ page }) => {
        await page.goto("/login");
        await page.getByRole("link", { name: /sign up|register|create/i }).click();
        await expect(page).toHaveURL(/register/);
    });
});
