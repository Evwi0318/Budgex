import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { manyExpenses, openApp, openSavings } from "./app";

const activeTab = (page: Page) =>
  page.locator('button[aria-pressed="true"]').first();

/** Drar vågrätt från en punkt, i steg så att riktningslåset hinner slå till */
const drag = async (page: Page, from: { x: number; y: number }, dx: number) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(from.x + (dx * step) / 10, from.y, { steps: 2 });
  }
  await page.mouse.up();
  await page.waitForTimeout(350);
};

const heroCentre = async (page: Page) => {
  const box = (await page.locator(".hero-card").boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test("svep åt vänster och höger byter flik", async ({ page }) => {
  await openApp(page);
  await expect(activeTab(page)).toContainText("Utgifter");

  await drag(page, await heroCentre(page), -120);
  await expect(activeTab(page)).toContainText("Sparande");

  await drag(page, await heroCentre(page), 120);
  await expect(activeTab(page)).toContainText("Utgifter");

  await drag(page, await heroCentre(page), 120);
  await expect(activeTab(page)).toContainText("Inkomst");
});

test("svepet stannar vid ytterflikarna", async ({ page }) => {
  await openApp(page);

  await drag(page, await heroCentre(page), 120);
  await expect(activeTab(page)).toContainText("Inkomst");

  await drag(page, await heroCentre(page), 120);
  await expect(activeTab(page)).toContainText("Inkomst");

  await openSavings(page);
  await drag(page, await heroCentre(page), -120);
  await expect(activeTab(page)).toContainText("Sparande");
});

test("en kort rörelse byter inte flik", async ({ page }) => {
  await openApp(page);

  await drag(page, await heroCentre(page), -30);

  await expect(activeTab(page)).toContainText("Utgifter");
});

test("svep på en rad tar bort raden i stället för att byta flik", async ({
  page,
}) => {
  await openApp(page);

  const row = (await page
    .getByRole("button", { name: "Öppna Elräkning" })
    .locator("xpath=..")
    .boundingBox())!;

  await drag(page, { x: row.x + row.width - 40, y: row.y + row.height / 2 }, -120);

  // Fliken står kvar, och radens egen ta-bort-yta har avslöjats
  await expect(activeTab(page)).toContainText("Utgifter");
  await expect(page.getByRole("button", { name: "Ta bort", exact: true })).toBeVisible();
});

test("svep på månadsraden byter månad, inte flik", async ({ page }) => {
  await openApp(page);
  const nav = (await page
    .getByRole("button", { name: "Föregående månad" })
    .locator("xpath=..")
    .boundingBox())!;

  await drag(page, { x: nav.x + nav.width / 2, y: nav.y + nav.height / 2 }, 120);

  await expect(activeTab(page)).toContainText("Utgifter");
  await expect(page.getByRole("button", { name: "🔒 Avslutad — lås upp" })).toBeVisible();
});

test("lodrätt svep scrollar i stället för att byta flik", async ({ page }) => {
  await openApp(page, { expenses: manyExpenses(15) });

  const start = await heroCentre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y - 200, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  await expect(activeTab(page)).toContainText("Utgifter");
});

test("knapparna sitter i appens kant, inte skärmens", async ({ page }) => {
  await openApp(page);

  const frame = (await page.locator("main").boundingBox())!;
  const profile = (await page.getByRole("link", { name: "Profil" }).boundingBox())!;
  const fab = (await page.getByRole("button", { name: /^Lägg till / }).boundingBox())!;

  // Profilknappen ska ligga innanför appens högerkant
  expect(profile.x + profile.width).toBeLessThanOrEqual(frame.x + frame.width);
  expect(profile.x).toBeGreaterThan(frame.x);

  // Plusknappen ska vara centrerad i appen
  const appCentre = frame.x + frame.width / 2;
  expect(fab.x + fab.width / 2).toBeCloseTo(appCentre, 0);
});
