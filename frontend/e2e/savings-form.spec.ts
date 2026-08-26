import { expect, test } from "@playwright/test";
import { dialog, fab, openApp, openSavings } from "./app";

test("skapar ett sparkonto med en procentregel", async ({ page }) => {
  await openApp(page);
  await openSavings(page);
  await fab(page, "Lägg till sparkonto").click();

  const sheet = dialog(page, "Nytt sparkonto");
  await sheet.getByPlaceholder("t.ex. Buffert").fill("Bil");
  await sheet.getByRole("button", { name: /^Lön/ }).click();
  await sheet.getByRole("button", { name: "%", exact: true }).click();
  await sheet.locator('input[type="range"]').fill("20");

  // 20 % av 25 800 = 5 160
  await expect(sheet).toContainText(/Ger 5\s160 kr i månaden/);
  await sheet.getByRole("button", { name: "Lägg till" }).click();

  const row = page.getByRole("button", { name: /Öppna Bil/ });
  await expect(row).toContainText("20 % av Lön");
  await expect(row.locator("xpath=../..")).toContainText(/5\s160/);
});

test("sparar målbeloppet och visar när det nås", async ({ page }) => {
  await openApp(page);
  await openSavings(page);
  await fab(page, "Lägg till sparkonto").click();

  const sheet = dialog(page, "Nytt sparkonto");
  await sheet.getByPlaceholder("t.ex. Buffert").fill("Bil");
  await sheet.getByLabel("Redan sparat").fill("1000");
  await sheet.getByLabel("Målbelopp").fill("13000");
  await sheet.getByRole("button", { name: /^Lön/ }).click();

  // En nyvald källa står på 0 kr, så det finns inget datum att räkna på än
  await expect(sheet).toContainText("Välj en källa nedan");
  await sheet.getByRole("button", { name: "%", exact: true }).click();
  await sheet.locator('input[type="range"]').fill("10");

  await expect(sheet).toContainText(/är du framme ungefär \w+ \d{4}/);

  await sheet.getByRole("button", { name: "Lägg till" }).click();

  await expect(
    page.getByRole("button", { name: /Öppna Bil/ }).locator("xpath=../..")
  ).toContainText(/1\s000 kr av 13\s000 kr/);
});

test("säger till när det inte finns någon inkomst att fördela från", async ({ page }) => {
  await openApp(page, { income: [], accounts: [] });
  await openSavings(page);
  await fab(page, "Lägg till sparkonto").click();

  const sheet = dialog(page, "Nytt sparkonto");
  await expect(sheet).toContainText("Du har inga inkomster den här månaden");
  await expect(sheet).toContainText("Ingen källa vald");
});

test("varnar när en källa är överfördelad", async ({ page }) => {
  await openApp(page, {
    accounts: [
      {
        id: "s1",
        name: "Buffert",
        icon: "🐷",
        goal: null,
        saved: null,
        isTransferred: false,
        rules: [{ sourceEntryId: "i1", ruleType: "Fixed", value: 20000 }],
      },
      {
        id: "s2",
        name: "Resa",
        icon: "✈️",
        goal: null,
        saved: null,
        isTransferred: false,
        rules: [{ sourceEntryId: "i1", ruleType: "Fixed", value: 20000 }],
      },
    ],
  });
  await openSavings(page);

  // 40 000 fördelat från en lön på 25 800
  await expect(
    page.getByRole("button", { name: /Öppna Buffert/ }).locator("xpath=../..")
  ).toContainText(/Du fördelar 40\s000 kr från Lön som ger 25\s800 kr/);
});
