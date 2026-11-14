import { expect, test } from "@playwright/test";
import { openApp, openSavings } from "./app";

const overBudget = {
  expenses: [
    {
      id: "e1",
      kind: "Expense" as const,
      name: "Hyra",
      category: "Housing",
      amount: 25000,
      isAutogiro: false,
      isPaid: false,
      repeats: true,
    },
  ],
};

test("en överföring utan täckning måste bekräftas", async ({ page }) => {
  await openApp(page, overBudget);
  await openSavings(page);

  const sent: unknown[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/transferred")) sent.push(request.postDataJSON());
  });

  const buffert = page.getByRole("switch", { name: /till Buffert/ });
  await buffert.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(/Planen överstiger inkomsten med 2\s280 kr/);
  expect(sent).toHaveLength(0);

  await dialog.getByRole("button", { name: "Markera ändå" }).click();

  await expect.poll(() => sent).toEqual([{ isTransferred: true, acknowledged: true }]);
});

test("avbruten bekräftelse överför ingenting", async ({ page }) => {
  await openApp(page, overBudget);
  await openSavings(page);

  await page.getByRole("button", { name: /Markera alla som överförda/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Avbryt" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Markera alla som överförda/ })).toBeVisible();
});
