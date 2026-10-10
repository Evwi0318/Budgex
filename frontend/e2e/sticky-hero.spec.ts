import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { manyExpenses, openApp, openIncome, prevMonth } from "./app";

const heroAmount = (page: Page) => page.getByLabel(/kvar att spendera$/);

const scrollTo = (page: Page, top: number) =>
  page.locator("main").evaluate((el, value) => {
    el.scrollTop = value;
  }, top);

const fontSize = (page: Page) =>
  heroAmount(page).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

test.beforeEach(async ({ page }) => {
  await openApp(page, { expenses: manyExpenses(15) });
});

test("hero-kortet stannar kvar överst när listan scrollar", async ({ page }) => {
  const before = (await heroAmount(page).boundingBox())!;

  await scrollTo(page, 400);
  await page.waitForTimeout(400);

  const after = (await heroAmount(page).boundingBox())!;

  // Kortet får krympa, men det ska aldrig lämna skärmen
  await expect(heroAmount(page)).toBeInViewport();
  expect(after.y).toBeLessThanOrEqual(before.y);
  expect(after.y).toBeGreaterThan(0);
});

test("kortet komprimeras vid scroll och växer tillbaka", async ({ page }) => {
  expect(await fontSize(page)).toBeCloseTo(42, 0);
  await expect(page.getByText("Kvar att spendera")).toBeVisible();

  await scrollTo(page, 200);
  await page.waitForTimeout(400);

  expect(await fontSize(page)).toBeCloseTo(26, 0);
  // Texten tonas ut, men tas aldrig ur flödet
  await expect(page.getByText("Kvar att spendera")).not.toBeVisible();

  await scrollTo(page, 0);
  await page.waitForTimeout(400);

  expect(await fontSize(page)).toBeCloseTo(42, 0);
  await expect(page.getByText("Kvar att spendera")).toBeVisible();
});

test("sista raden är nåbar även med ångra-fönstret framme", async ({ page }) => {
  await page.getByRole("button", { name: "Öppna Utgift 01" }).click();
  await page.getByRole("button", { name: "Ta bort", exact: true }).click();
  await page
    .getByRole("dialog")
    .filter({ hasText: "Ta bort Utgift 01?" })
    .getByRole("button", { name: /^Bara / })
    .click();

  const toast = page.getByRole("status");
  await expect(toast).toBeVisible();

  const last = page.getByRole("button", { name: "Öppna Utgift 15" });
  await last.scrollIntoViewIfNeeded();

  const row = (await last.locator("xpath=..").boundingBox())!;
  const box = (await toast.boundingBox())!;
  expect(row.y + row.height).toBeLessThanOrEqual(box.y);

  await last.click();
  await expect(page.getByRole("button", { name: "Ta bort", exact: true })).toBeVisible();
});

test("en låst månad ser låst ut men kortet förblir täckande", async ({ page }) => {
  await prevMonth(page).click();
  await expect(page.getByRole("button", { name: "🔒 Avslutad — lås upp" })).toBeVisible();

  await scrollTo(page, 200);
  await page.waitForTimeout(400);

  expect(await fontSize(page)).toBeCloseTo(26, 0);
  await expect(page.getByRole("button", { name: "Lägg till utgift" })).toHaveCount(0);

  const [card, content] = await page.locator(".hero-card").evaluate((el) => [
    getComputedStyle(el).opacity,
    getComputedStyle(el.firstElementChild!).opacity,
  ]);
  expect(card).toBe("1");
  expect(parseFloat(content)).toBeLessThan(1);
});

test("kortet står stilla halvvägs komprimerat", async ({ page }) => {
  await scrollTo(page, 40);
  await page.waitForTimeout(600);
  const size = await fontSize(page);

  await page.waitForTimeout(600);

  expect(await page.locator("main").evaluate((el) => el.scrollTop)).toBe(40);
  expect(await fontSize(page)).toBe(size);
  expect(size).toBeGreaterThan(26);
  expect(size).toBeLessThan(42);
});

test("en kort flik går inte att scrolla och komprimeras aldrig", async ({ page }) => {
  await scrollTo(page, 300);
  await page.waitForTimeout(400);
  await openIncome(page);
  await page.waitForTimeout(800);

  await scrollTo(page, 300);
  await page.waitForTimeout(400);

  expect(await page.locator("main").evaluate((el) => el.scrollTop)).toBe(0);
  expect(await fontSize(page)).toBeCloseTo(42, 0);
});

test("kortet följer scrollen steg för steg", async ({ page }) => {
  const sizes: number[] = [];
  for (let top = 0; top <= 90; top += 10) {
    await scrollTo(page, top);
    sizes.push(await fontSize(page));
  }

  const steps = sizes.slice(1).map((size, i) => sizes[i] - size);
  expect(sizes[0]).toBeCloseTo(42, 0);
  expect(sizes.at(-1)).toBeCloseTo(26, 0);
  expect(Math.min(...steps)).toBeGreaterThan(0);
  expect(Math.max(...steps)).toBeLessThan(3);
});
