import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { openApp } from "./app";

const bigIncome = {
  income: [
    {
      id: "i1",
      kind: "Income" as const,
      name: "Lön",
      category: "Salary",
      amount: 2_500_000,
      isAutogiro: false,
      isPaid: false,
      repeats: true,
    },
  ],
};

const heroCentre = async (page: Page) => {
  const box = (await page.locator(".hero-card").boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

const hold = async (page: Page, ms = 700) => {
  const at = await heroCentre(page);

  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
};

test("stora tal kortas av i hero-kortet i stället för att brytas", async ({
  page,
}) => {
  await openApp(page, bigIncome);

  // 2 500 000 blir "2,5 mn kr", och kvar att spendera likaså
  await expect(page.getByRole("button", { name: /^Inkomst/ })).toContainText(
    /2,5\s?mn/
  );
  await expect(page.getByLabel(/kvar att spendera$/)).toContainText(/mn/);

  // Ingen siffra får radbryta: kortet ska vara lika högt som med små tal
  const lines = await page
    .getByRole("button", { name: /^Inkomst/ })
    .evaluate((el) => el.getClientRects().length);
  expect(lines).toBe(1);
});

test("långtryck på hero-kortet visar de exakta beloppen", async ({ page }) => {
  await openApp(page, bigIncome);

  await hold(page);

  const dialog = page.getByRole("dialog", { name: /Exakta belopp/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/2\s500\s000\s?kr/);
  await expect(dialog).toContainText("Sparande");

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("långtryck byter inte flik även om fingret ligger på en flik", async ({
  page,
}) => {
  await openApp(page, bigIncome);

  const box = (await page
    .getByRole("button", { name: /^Inkomst/ })
    .boundingBox())!;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();

  await expect(page.getByRole("dialog", { name: /Exakta belopp/ })).toBeVisible();
  await expect(
    page.locator('button[aria-pressed="true"]').first()
  ).toContainText("Utgifter");
});

test("ett kort tryck på en flik byter flik som vanligt", async ({ page }) => {
  await openApp(page);

  await page.getByRole("button", { name: /^Inkomst/ }).click();

  await expect(
    page.locator('button[aria-pressed="true"]').first()
  ).toContainText("Inkomst");
  await expect(page.getByRole("dialog", { name: /Exakta belopp/ })).toHaveCount(0);
});
