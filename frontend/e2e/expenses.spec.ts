import { expect, test } from "@playwright/test";
import { entryRow, openApp, paidBox, paymentRow } from "./app";

test("bockar av en utgift och räknar ner den som är kvar att betala", async ({
  page,
}) => {
  await openApp(page);

  // Elräkning 1 200 + Mat 2 400. Hyra är autogiro och räknas aldrig med.
  await expect(paymentRow(page)).toContainText(/2 kvar att betala själv/);
  await expect(paymentRow(page)).toContainText(/3\s600/);

  await paidBox(page, "Elräkning").click();

  await expect(paymentRow(page)).toContainText(/1 kvar att betala själv/);
  await expect(paymentRow(page)).toContainText(/2\s400/);
  await expect(paidBox(page, "Elräkning")).toHaveAttribute("aria-pressed", "true");
});

test("autogiro har ingen kryssruta", async ({ page }) => {
  await openApp(page);

  await expect(entryRow(page, "Hyra")).toBeVisible();
  await expect(
    entryRow(page, "Hyra").getByRole("button", { name: /^Markera som/ })
  ).toHaveCount(0);

  await expect(paidBox(page, "Elräkning")).toHaveCount(1);
  await expect(paidBox(page, "Mat")).toHaveCount(1);
});

test("visar undertexten för varje slags post", async ({ page }) => {
  await openApp(page);

  await expect(entryRow(page, "Hyra")).toContainText("Autogiro · Varje månad");
  await expect(entryRow(page, "Elräkning")).toContainText("Varje månad");
  await expect(entryRow(page, "Mat")).toContainText(/Bara /);
});

test("säger att allt är betalt när sista manuella utgiften bockas av", async ({
  page,
}) => {
  await openApp(page);

  await paidBox(page, "Elräkning").click();
  await expect(paymentRow(page)).toContainText(/1 kvar att betala själv/);

  await paidBox(page, "Mat").click();

  await expect(paymentRow(page)).toContainText(/Allt är betalt i/);
});
