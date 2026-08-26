import { expect, test } from "@playwright/test";
import { manyExpenses, openApp } from "./app";

const LAST = "Utgift 15";

test.beforeEach(async ({ page }) => {
  await openApp(page, { expenses: manyExpenses(15) });
});

test("sista raden i en lång lista går att öppna", async ({ page }) => {
  const last = page.getByRole("button", { name: `Öppna ${LAST}` });
  await last.scrollIntoViewIfNeeded();

  await last.click();

  await expect(page.getByRole("button", { name: "Ta bort", exact: true })).toBeVisible();
});

test("sista raden ligger fritt från den flytande knappen", async ({ page }) => {
  const last = page.getByRole("button", { name: `Öppna ${LAST}` }).locator("xpath=..");
  await last.scrollIntoViewIfNeeded();

  const row = await last.boundingBox();
  const fab = await page.getByRole("button", { name: "Lägg till utgift" }).boundingBox();
  if (!row || !fab) throw new Error("hittade inte raden eller knappen");

  const overlapsVertically = row.y + row.height > fab.y && row.y < fab.y + fab.height;
  const overlapsHorizontally = row.x + row.width > fab.x && row.x < fab.x + fab.width;

  expect(overlapsVertically && overlapsHorizontally).toBe(false);
});
