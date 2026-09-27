import { expect, test } from "@playwright/test";
import { dialog, fab, openApp, openSavings } from "./app";

test("räknar månadsbeloppet från posterna", async ({ page }) => {
  await openApp(page);
  await openSavings(page);
  await fab(page, "Lägg till sparkonto").click();

  const sheet = dialog(page, "Nytt sparkonto");
  await sheet.getByPlaceholder("t.ex. Buffert").fill("Årliga utgifter");

  for (const [name, amount] of [
    ["Försäkring", "1800"],
    ["Abonnemang", "600"],
  ]) {
    await sheet.getByRole("button", { name: "+ Ny post" }).click();
    await sheet.getByLabel("Postens namn").fill(name);
    await sheet.getByLabel("Belopp per år").fill(amount);
    await sheet.getByRole("button", { name: "Lägg till post" }).click();
  }

  await expect(sheet).toContainText(/2\s400 kr\/år ÷ 12 = 200 kr\/mån/);
  await sheet.getByRole("button", { name: /^Lön/ }).click();
  await sheet.getByRole("button", { name: "Lägg till", exact: true }).click();

  const row = page.getByRole("button", { name: /Öppna Årliga utgifter/ });
  const card = row.locator("xpath=../..");
  await expect(row).toContainText("från Lön");
  await expect(row).toContainText("200");

  await page
    .getByRole("button", { name: "Visa vad Årliga utgifter sparar till" })
    .click();
  await expect(card).toContainText(/Försäkring1\s800 kr · januari/);
  await expect(card).toContainText(/Abonnemang600 kr · januari/);

  await row.click();
  const edit = dialog(page, "Redigera sparkonto");
  await edit.getByRole("button", { name: "Ta bort Abonnemang" }).click();
  await edit.getByRole("button", { name: "Spara", exact: true }).click();

  await expect(row).toContainText("150");
  await expect(card).not.toContainText("Abonnemang");
});
