import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { dialog, entryRow, openApp, paymentRow } from "./app";

const removeFromSheet = async (page: Page, name: string) => {
  await page.getByRole("button", { name: `Öppna ${name}` }).click();
  await page.getByRole("button", { name: "Ta bort", exact: true }).click();
};

test("frågar om omfattning innan en återkommande utgift tas bort", async ({ page }) => {
  await openApp(page);

  await removeFromSheet(page, "Elräkning");

  const scope = dialog(page, "Ta bort Elräkning?");
  await expect(scope).toContainText("återkommer varje månad");
  await expect(scope.getByRole("button", { name: /^Bara / })).toBeVisible();
  await expect(
    scope.getByRole("button", { name: "Den här och kommande månader" })
  ).toBeVisible();
  await expect(scope.getByRole("button", { name: "Avbryt" })).toBeVisible();

  await scope.getByRole("button", { name: "Avbryt" }).click();
  await expect(entryRow(page, "Elräkning")).toBeVisible();
});

test("ångrar en borttagning innan den hunnit skickas", async ({ page }) => {
  await openApp(page);

  await removeFromSheet(page, "Elräkning");
  await dialog(page, "Ta bort Elräkning?")
    .getByRole("button", { name: /^Bara / })
    .click();

  const toast = page.getByRole("status");
  await expect(toast).toContainText("Utgiften Elräkning borttagen");
  await expect(entryRow(page, "Elräkning")).toHaveCount(0);
  await expect(paymentRow(page)).toContainText(/1 kvar att betala själv/);

  await toast.getByRole("button", { name: "Ångra" }).click();

  await expect(entryRow(page, "Elräkning")).toBeVisible();
  await expect(paymentRow(page)).toContainText(/2 kvar att betala själv/);
  await expect(toast).toHaveCount(0);
});

test("tar bort en engångsutgift utan att fråga", async ({ page }) => {
  await openApp(page);

  // Mat har repeats: false, så det finns ingen omfattning att välja
  await removeFromSheet(page, "Mat");

  await expect(page.getByRole("status")).toContainText("Utgiften Mat borttagen");
  await expect(entryRow(page, "Mat")).toHaveCount(0);
});

test("raderingen står kvar när ångra-fönstret runnit ut", async ({ page }) => {
  await openApp(page);

  await removeFromSheet(page, "Mat");
  await expect(page.getByRole("status")).toBeVisible();

  // UNDO_MS är 5 s i Home.tsx
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 10_000 });

  await page.reload();
  await expect(entryRow(page, "Hyra")).toBeVisible();
  await expect(entryRow(page, "Mat")).toHaveCount(0);
});
