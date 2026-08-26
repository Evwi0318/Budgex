import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { manyExpenses, openApp, openSavings, prevMonth } from "./app";

/** Hela månadsraden — pilarnas gemensamma förälder */
const monthRow = (page: Page) => prevMonth(page).locator("xpath=..");

const monthLabel = (monthsBack: number) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - monthsBack);
  const name = date.toLocaleString("sv-SE", { month: "long" });

  return `${name[0].toUpperCase()}${name.slice(1)} ${date.getFullYear()}`;
};

const overflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
  );

test("svep åt höger på månadsraden går till föregående månad", async ({ page }) => {
  await openApp(page);
  await expect(monthRow(page)).toContainText(monthLabel(0));

  const box = (await monthRow(page).boundingBox())!;
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 90, y, { steps: 12 });
  await page.mouse.up();

  await expect(monthRow(page)).toContainText(monthLabel(1));
});

test("ingen flik ger horisontell scroll", async ({ page }) => {
  await openApp(page, { expenses: manyExpenses(15) });

  expect(await overflow(page)).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: /^Inkomst/ }).click();
  expect(await overflow(page)).toBeLessThanOrEqual(0);

  await openSavings(page);
  await expect(page.getByRole("button", { name: /Öppna Buffert/ })).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
});
