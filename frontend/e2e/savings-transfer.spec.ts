import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { openApp, openSavings } from "./app";

const transferSwitch = (page: Page, name: string) =>
  page.getByRole("switch", { name: new RegExp(`till ${name}`) });

const markAll = (page: Page) =>
  page.getByRole("button", { name: /Markera alla som överförda/ });

const allDone = (page: Page) => page.getByRole("button", { name: /Allt överfört i/ });

const showTransferred = (page: Page) =>
  page.getByRole("button", { name: /överförda$/ });

const backToRemaining = (page: Page) => page.getByRole("button", { name: /kvar$/ });

test.beforeEach(async ({ page }) => {
  await openApp(page);
  await openSavings(page);
});

test("visar sparkontona med sina regler och summan att överföra", async ({ page }) => {
  // Buffert 10 % av 25 800 = 2 580, Resa fast 500. Summa 3 080.
  await expect(page.getByRole("button", { name: /Öppna Buffert/ })).toContainText(
    "10 % av Lön"
  );
  await expect(page.getByRole("button", { name: /Öppna Resa/ })).toContainText(
    /500 kr från Lön/
  );
  await expect(markAll(page)).toContainText(/3\s080/);
});

test("bockar av ett konto och visar hur många som är överförda", async ({ page }) => {
  await expect(page.getByText("Bocka av när du gjort överföringen")).toBeVisible();

  await transferSwitch(page, "Buffert").click();

  // Ett avbockat konto lämnar kvar-listan och räknas i stället som överfört
  await expect(page.getByRole("button", { name: /Öppna Buffert/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Öppna Resa/ })).toBeVisible();
  await expect(showTransferred(page)).toContainText("1 överförda");
  await expect(markAll(page)).toContainText(/500/);
  await expect(page.getByText("Bocka av när du gjort överföringen")).toHaveCount(0);

  await showTransferred(page).click();
  await expect(transferSwitch(page, "Buffert")).toHaveAttribute("aria-checked", "true");
});

test("växlar mellan kvarvarande och överförda konton", async ({ page }) => {
  await transferSwitch(page, "Buffert").click();
  await showTransferred(page).click();

  await expect(page.getByText(/^Överfört i /)).toBeVisible();
  await expect(page.getByRole("button", { name: /Öppna Buffert/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Öppna Resa/ })).toHaveCount(0);

  await backToRemaining(page).click();

  await expect(page.getByText("Sparkonton")).toBeVisible();
  await expect(page.getByRole("button", { name: /Öppna Resa/ })).toBeVisible();
});

test("faller tillbaka till listan när sista bocken tas bort i överfört-vyn", async ({
  page,
}) => {
  await transferSwitch(page, "Buffert").click();
  await showTransferred(page).click();
  await expect(page.getByText(/^Överfört i /)).toBeVisible();

  // Kontot bockas av här inne — då finns ingen överförd-lista kvar att visa
  await transferSwitch(page, "Buffert").click();

  await expect(page.getByText("Sparkonton")).toBeVisible();
  await expect(page.getByRole("button", { name: /Öppna Buffert/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Öppna Resa/ })).toBeVisible();
  await expect(page.getByText(/^Överfört i /)).toHaveCount(0);
});

test("markerar alla som överförda och ångrar det", async ({ page }) => {
  await markAll(page).click();

  await expect(allDone(page)).toBeVisible();
  await expect(allDone(page)).toContainText("Ångra alla överföringar");
  await expect(page.getByText(/Allt är överfört i /)).toBeVisible();

  await allDone(page).click();

  await expect(markAll(page)).toContainText(/3\s080/);
  await expect(transferSwitch(page, "Buffert")).toHaveAttribute("aria-checked", "false");
  await expect(transferSwitch(page, "Resa")).toHaveAttribute("aria-checked", "false");
});

test("visar sparmålets text och när målet nås", async ({ page }) => {
  // Buffert: 200 av 66 000, 2 580 i månaden
  const row = page.getByRole("button", { name: /Öppna Buffert/ }).locator("xpath=../..");

  await expect(row).toContainText(/200 kr av 66\s000 kr/);
  await expect(row).toContainText(/ungefär \w+ \d{4}/);

  // Resa saknar mål och ska därför inte visa någon rad om det
  const resa = page.getByRole("button", { name: /Öppna Resa/ }).locator("xpath=../..");
  await expect(resa).not.toContainText("ungefär");
});
