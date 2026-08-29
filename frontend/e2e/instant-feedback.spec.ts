import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { openApp, openSavings, paidBox } from "./app";

const SLOW = 1500;
const FAST = 600;

/** Låter ett anrop dröja, så att bara en optimistisk uppdatering hinner synas */
const delay = (page: Page, pattern: string) =>
  page.route(pattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SLOW));
    await route.fallback();
  });

test("sparandefliken hämtas en gång och laddas inte om vid svep", async ({
  page,
}) => {
  const fetches: string[] = [];

  page.on("request", (request) => {
    if (
      request.method() === "GET" &&
      new URL(request.url()).pathname.endsWith("/savings")
    ) {
      fetches.push(request.url());
    }
  });

  await openApp(page);
  await expect.poll(() => fetches.length).toBeGreaterThan(0);

  const before = fetches.length;
  await openSavings(page);

  // Panelen är redan monterad: kontona ska stå där direkt, utan skelett
  await expect(page.getByRole("button", { name: /Öppna Buffert/ })).toBeVisible({
    timeout: FAST,
  });
  expect(fetches.length).toBe(before);
});

test("bocken på ett sparkonto rör sig innan servern svarat", async ({ page }) => {
  await openApp(page);
  await openSavings(page);
  await delay(page, "**/savings/*/transferred");

  await page
    .getByRole("switch", { name: new RegExp("till Buffert") })
    .click();

  await expect(page.getByRole("button", { name: /Öppna Buffert/ })).toHaveCount(
    0,
    { timeout: FAST }
  );
  await expect(page.getByRole("button", { name: /1 överförda/ })).toBeVisible({
    timeout: FAST,
  });
});

test("bocken på en utgift rör sig innan servern svarat", async ({ page }) => {
  await openApp(page);
  await delay(page, "**/entries/*/paid");

  await paidBox(page, "Elräkning").click();

  await expect(page.getByRole("button", { name: /Öppna Elräkning/ })).toHaveCount(
    0,
    { timeout: FAST }
  );
  await expect(page.getByRole("button", { name: /1 betalda/ })).toBeVisible({
    timeout: FAST,
  });
});

test("markera alla som överförda slår om direkt", async ({ page }) => {
  await openApp(page);
  await openSavings(page);
  await delay(page, "**/savings/transferred");

  await page.getByRole("button", { name: /Markera alla som överförda/ }).click();

  await expect(page.getByRole("button", { name: /Allt överfört i/ })).toBeVisible({
    timeout: FAST,
  });
});
