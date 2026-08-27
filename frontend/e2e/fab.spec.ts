import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { manyExpenses, openApp, openSavings, prevMonth } from "./app";

const fab = (page: Page) => page.getByRole("button", { name: /^Lägg till / });

const background = (page: Page) =>
  fab(page).evaluate((el) => getComputedStyle(el).backgroundColor);

test("knappen byter etikett och färg med fliken", async ({ page }) => {
  await openApp(page);

  await expect(fab(page)).toHaveText("+Utgift");
  await expect(fab(page)).toHaveAttribute("aria-label", "Lägg till utgift");
  const expense = await background(page);

  await page.getByRole("button", { name: /^Inkomst/ }).click();
  await expect(fab(page)).toHaveText("+Inkomst");
  await expect(fab(page)).toHaveAttribute("aria-label", "Lägg till inkomst");

  await openSavings(page);
  await expect(fab(page)).toHaveText("+Sparkonto");
  await expect(fab(page)).toHaveAttribute("aria-label", "Lägg till sparkonto");
  const savings = await background(page);

  expect(savings).not.toBe(expense);
});

test("knappen öppnar rätt formulär i varje flik", async ({ page }) => {
  await openApp(page);

  await fab(page).click();
  await expect(page.getByRole("dialog")).toContainText("Ny utgift");
  await page.keyboard.press("Escape");

  await openSavings(page);
  await fab(page).click();
  await expect(page.getByRole("dialog")).toContainText("Nytt sparkonto");
});

test("knappen ligger kvar när listan scrollar", async ({ page }) => {
  await openApp(page, { expenses: manyExpenses(15) });
  const before = (await fab(page).boundingBox())!;

  await page.locator("main").evaluate((el) => {
    el.scrollTop = 400;
  });
  await page.waitForTimeout(400);

  const after = (await fab(page).boundingBox())!;
  expect(after.y).toBeCloseTo(before.y, 0);
  await expect(fab(page)).toBeInViewport();
});

test("profilknappen visar en profilikon och är lika stor som plusknappen", async ({
  page,
}) => {
  await openApp(page);

  const profile = page.getByRole("link", { name: "Profil" });
  await expect(profile.locator("svg")).toBeVisible();

  const box = (await profile.boundingBox())!;
  const plus = (await fab(page).boundingBox())!;

  expect(box.height).toBeCloseTo(plus.height, 0);
  // Träffytan ska vara minst 44 px åt båda håll
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test("profilknappen finns kvar i en låst månad, plusknappen inte", async ({
  page,
}) => {
  await openApp(page);
  await prevMonth(page).click();

  await expect(page.getByRole("link", { name: "Profil" })).toBeVisible();
  await expect(fab(page)).toHaveCount(0);
});
