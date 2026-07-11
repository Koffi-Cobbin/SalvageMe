import { test, expect } from "@playwright/test";

// Critical-path E2E: signup -> create listing -> request -> complete exchange.
// Runs against the mock adapter by default (NEXT_PUBLIC_API_MODE=mock).
test("visitor can browse listings and view a listing detail page", async ({ page }) => {
  await page.goto("/listings");
  await expect(page.getByRole("heading", { name: "Browse books" })).toBeVisible();
  await page.getByRole("link").filter({ hasText: /Set|Bundle|Algebra/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test.skip("full signup -> list -> request -> complete flow", async ({ page }) => {
  // Skipped scaffold: needs a seeded second test user + mock-adapter reset
  // hook to run in CI without cross-test state bleed. Flagged as follow-up.
});
