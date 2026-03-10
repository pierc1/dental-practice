import { expect, test } from "@playwright/test";

const adminUsername = process.env.PLAYWRIGHT_ADMIN_USERNAME;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;
const bookingEnabled = process.env.PLAYWRIGHT_BOOKING_ENABLED === "1";

const selectFirstOption = async (page, index: number) => {
  await page.getByRole("combobox").nth(index).click();
  await page.getByRole("option").first().click();
};

test("home loads and primary CTA navigation works", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /because your smile/i })).toBeVisible();

  const cta = page.locator('a[href*="/book-appointment"]').first();
  await expect(cta).toBeVisible();
  await cta.click();

  await expect(page).toHaveURL(/book-appointment/i);
});

test("admin login reaches appointments page", async ({ page }) => {
  test.skip(
    !adminUsername || !adminPassword,
    "Set PLAYWRIGHT_ADMIN_USERNAME and PLAYWRIGHT_ADMIN_PASSWORD to run the admin auth smoke test."
  );

  await page.goto("/admin");
  await page.getByLabel(/admin username/i).fill(adminUsername as string);
  await page.getByLabel(/admin password/i).fill(adminPassword as string);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page).toHaveURL(/\/admin\/appointments/i);
  await expect(page.getByRole("heading", { name: /appointments admin/i })).toBeVisible();
});

test("booking happy-path submit succeeds", async ({ page }) => {
  test.skip(
    !bookingEnabled,
    "Set PLAYWRIGHT_BOOKING_ENABLED=1 and point PLAYWRIGHT_BASE_URL at an isolated test deployment before running booking smoke."
  );

  await page.goto("/book-appointment");

  await selectFirstOption(page, 0);
  await selectFirstOption(page, 1);
  await selectFirstOption(page, 2);

  await page.getByLabel(/first name/i).fill("Playwright");
  await page.getByLabel(/last name/i).fill("Smoke");
  await page.getByLabel(/email address/i).fill(`playwright-${Date.now()}@example.com`);
  await page.getByLabel(/phone number/i).fill("(555) 010-0000");
  await page.getByLabel(/additional notes/i).fill("Automated smoke test booking.");

  await page.getByRole("button", { name: /book appointment/i }).click();

  await expect(page.getByRole("heading", { name: /appointment requested/i })).toBeVisible();
});
