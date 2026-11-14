import { expect, test, type Page } from "@playwright/test";
import { mockApi, openApp } from "./app";

const cors = (page: Page) => ({
  "access-control-allow-origin": page.url().startsWith("http") ? new URL(page.url()).origin : "*",
  "access-control-allow-credentials": "true",
});

test("fel inloggning avslöjar inte om kontot finns", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401 }));
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ status: 401, headers: cors(page) })
  );

  await page.goto("/login");
  await page.getByLabel("E-post").fill("okand@budgex.se");
  await page.getByLabel("Lösenord").fill("Test1234!");
  await page.locator('button[type="submit"]').click();

  await expect(page.getByText(/Fel e-post eller lösenord\. Efter flera misslyckade försök/)).toBeVisible();
});

test("logga ut från alla enheter avslutar sessionen", async ({ page }) => {
  await openApp(page);

  let revoked = false;
  await page.route("**/api/auth/logout-all", (route) => {
    revoked = true;
    return route.fulfill({ status: 204, headers: cors(page) });
  });

  await page.goto("/profile");
  await page.getByRole("button", { name: "Logga ut från alla enheter" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Logga ut överallt" }).click();

  await expect(page).toHaveURL(/\/login/);
  expect(revoked).toBe(true);
});

test("efter lösenordsbyte loggas man in igen med det nya lösenordet", async ({ page }) => {
  await openApp(page);

  const logins: unknown[] = [];
  await page.route("**/api/profile/password", (route) =>
    route.fulfill({ status: 204, headers: cors(page) })
  );
  await page.route("**/api/auth/login", (route) => {
    logins.push(route.request().postDataJSON());
    return route.fulfill({ headers: cors(page), json: { accessToken: "new-token" } });
  });

  await page.goto("/profile");
  await page.getByRole("button", { name: "Byt lösenord" }).click();
  await page.getByLabel("Nuvarande lösenord").fill("Test1234!");
  await page.getByLabel("Nytt lösenord").fill("Brandnew1!");
  await page.getByRole("button", { name: "Byt", exact: true }).click();

  await expect.poll(() => logins).toEqual([{ email: "evan@budgex.test", password: "Brandnew1!" }]);
  await expect(page).toHaveURL(/\/profile/);
});
