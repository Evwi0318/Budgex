import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { fab, openApp, openSavings } from "./app";
import type { Entry } from "./app";

const income = (id: string, name: string): Entry => ({
  id,
  kind: "Income",
  name,
  category: "Salary",
  amount: 10000,
  isAutogiro: false,
  isPaid: false,
  repeats: true,
});

/** Många källor gör sparformuläret högre än arket, så listan kan scrollas */
const manyIncomes = Array.from({ length: 8 }, (_, index) =>
  income(`i${index + 1}`, `Inkomst ${index + 1}`)
);

const sheet = (page: Page, text: string) =>
  page.getByRole("dialog").filter({ hasText: text });

/** Arket glider upp när det öppnas — mät först när det står stilla */
const opened = async (page: Page, text: string) => {
  const form = sheet(page, text);

  await expect(form).toBeVisible();
  await page.waitForTimeout(500);

  return form;
};

const dragDown = async (
  page: Page,
  from: { x: number; y: number },
  distance: number
) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(from.x, from.y + (distance * step) / 10, { steps: 2 });
  }
  await page.mouse.up();
  await page.waitForTimeout(450);
};

test("arket går att dra ner från mitten, inte bara från överkanten", async ({
  page,
}) => {
  await openApp(page);
  await fab(page, "Lägg till utgift").click();

  const form = await opened(page, "Ny utgift");
  const box = (await form.boundingBox())!;
  await dragDown(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, 220);

  await expect(form).toHaveCount(0);
});

test("en scrollad lista scrollar i stället för att stänga arket", async ({
  page,
}) => {
  await openApp(page, { income: manyIncomes });
  await openSavings(page);
  await fab(page, "Lägg till sparkonto").click();

  const form = await opened(page, "Nytt sparkonto");
  const list = form.locator("div.overflow-y-auto");
  await list.evaluate((el) => {
    el.scrollTop = 150;
  });
  expect(await list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);

  const box = (await form.boundingBox())!;
  await dragDown(page, { x: box.x + box.width / 2, y: box.y + box.height * 0.6 }, 220);

  // Arket ska stå kvar — rörelsen hörde till listan
  await expect(form).toBeVisible();

  // Överkanten fungerar ändå, oavsett var listan står
  await dragDown(page, { x: box.x + box.width / 2, y: box.y + 20 }, 220);
  await expect(form).toHaveCount(0);
});

/** Arket ska ligga i sitt öppna läge, utan kvarhängande förskjutning */
const expectSettled = async (form: Locator) => {
  await expect
    .poll(async () => form.evaluate((el) => getComputedStyle(el).transform))
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0(\.\d+)?\))$/);
};

test("ett för kort drag lämnar inte arket hängande", async ({ page }) => {
  await openApp(page);
  await fab(page, "Lägg till utgift").click();

  const form = await opened(page, "Ny utgift");
  const box = (await form.boundingBox())!;
  await dragDown(page, { x: box.x + box.width / 2, y: box.y + 20 }, 60);

  await expect(form).toBeVisible();
  await expectSettled(form);
});

test("kom-tillbaka efter kasta-frågan tar upp arket igen", async ({ page }) => {
  await openApp(page);
  await fab(page, "Lägg till utgift").click();

  const form = await opened(page, "Ny utgift");
  await form.getByPlaceholder("T.ex. Hyra").fill("Ström");

  const box = (await form.boundingBox())!;
  await dragDown(page, { x: box.x + box.width / 2, y: box.y + 20 }, 220);

  const ask = page.getByRole("dialog").filter({ hasText: "Kasta ändringarna?" });
  await expect(ask).toBeVisible();
  await ask.getByRole("button", { name: "Fortsätt skriva" }).click();

  // Arket ska stå kvar uppe med texten kvar, inte ligga kvar nere bakom suddet
  await expect(form).toBeVisible();
  await expect(form.getByPlaceholder("T.ex. Hyra")).toHaveValue("Ström");
  await expectSettled(form);
});

test("skärmen går att använda direkt när arket dragits ner", async ({ page }) => {
  await openApp(page);
  await fab(page, "Lägg till utgift").click();

  const form = await opened(page, "Ny utgift");
  const box = (await form.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + 20;

  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(x, y + (220 * step) / 10, { steps: 2 });
  }
  await page.mouse.up();

  // Ingen kvarliggande yta som äter tryck medan arket glider ut
  await fab(page, "Lägg till utgift").click({ timeout: 450 });
  await expect(page.getByRole("dialog")).toContainText("Ny utgift");
});
