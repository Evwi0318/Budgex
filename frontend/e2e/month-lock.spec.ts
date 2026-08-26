import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { fab, nextMonth, openApp, paidBox, prevMonth } from "./app";

const unlock = (page: Page) =>
  page.getByRole("button", { name: "🔒 Avslutad — lås upp" });

const relock = (page: Page) =>
  page.getByRole("button", { name: "🔓 Upplåst — lås igen" });

test("innevarande månad går inte att bläddra förbi", async ({ page }) => {
  await openApp(page);

  await expect(nextMonth(page)).toBeDisabled();
  await expect(unlock(page)).toHaveCount(0);
});

test("en gången månad är skrivskyddad tills den låses upp", async ({ page }) => {
  await openApp(page);
  await prevMonth(page).click();

  await expect(unlock(page)).toBeVisible();
  await expect(fab(page, "Lägg till utgift")).toHaveCount(0);
  await expect(paidBox(page, "Elräkning")).toBeDisabled();

  await unlock(page).click();

  await expect(relock(page)).toBeVisible();
  await expect(fab(page, "Lägg till utgift")).toBeVisible();
  await expect(paidBox(page, "Elräkning")).toBeEnabled();
});

test("upplåsningen släpper när man byter månad", async ({ page }) => {
  await openApp(page);
  await prevMonth(page).click();
  await unlock(page).click();
  await expect(relock(page)).toBeVisible();

  await prevMonth(page).click();
  await nextMonth(page).click();

  await expect(unlock(page)).toBeVisible();
});

test("upplåsningen släpper när fönstret tappar fokus", async ({ page }) => {
  await openApp(page);
  await prevMonth(page).click();
  await unlock(page).click();
  await expect(relock(page)).toBeVisible();

  await page.evaluate(() => window.dispatchEvent(new Event("blur")));

  await expect(unlock(page)).toBeVisible();
});
