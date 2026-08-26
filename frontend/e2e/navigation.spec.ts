import { expect, test } from "@playwright/test";
import { mockApi, openApp, openSavings, prevMonth } from "./app";

test("gamla /savings-bokmärken landar på sparandefliken", async ({ page }) => {
  await mockApi(page);
  await page.goto("/savings");

  await expect(page.getByRole("button", { name: /Öppna Buffert/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Sparande/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  // Adressen ska ha bytts ut, inte ligga kvar som en egen sida
  await expect(page).toHaveURL(/\/$/);
});

test("profilen öppnas och bakåtpilen leder hem", async ({ page }) => {
  await openApp(page);

  await page.getByRole("link", { name: "Profil" }).click();

  await expect(page.getByRole("heading", { name: "Profil" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logga ut" })).toBeVisible();

  await page.getByRole("link", { name: "Tillbaka" }).click();

  await expect(page.getByRole("button", { name: /^Utgifter/ })).toBeVisible();
});

test("månad och flik överlever ett besök i profilen", async ({ page }) => {
  await openApp(page);
  await prevMonth(page).click();
  await openSavings(page);

  const month = await page.getByRole("button", { name: /^Sparande/ }).textContent();

  await page.getByRole("link", { name: "Profil" }).click();
  await page.getByRole("link", { name: "Tillbaka" }).click();

  await expect(page.getByRole("button", { name: /^Sparande/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByRole("button", { name: "🔒 Lås upp" })).toBeVisible();
  expect(await page.getByRole("button", { name: /^Sparande/ }).textContent()).toBe(month);
});
