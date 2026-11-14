import { expect, test } from "@playwright/test";
import { mockApi } from "./app";

const inbox = "Kolla din inkorg. Vi har skickat ett mejl med nästa steg.";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401 }));
});

test("registrering med verifiering ber om att kolla inkorgen", async ({ page }) => {
  let loggedIn = false;
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({ status: 202, json: { message: inbox } })
  );
  await page.route("**/api/auth/login", (route) => {
    loggedIn = true;
    return route.fulfill({ json: { accessToken: "test-token" } });
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Registrera" }).click();
  await page.getByLabel("E-post").fill("ny@budgex.se");
  await page.getByLabel("Lösenord").fill("Test1234!");
  await page.locator('button[type="submit"]').click();

  await expect(page.getByRole("status")).toHaveText(inbox);
  expect(loggedIn).toBe(false);
});

test("obekräftat konto kan få länken skickad igen", async ({ page }) => {
  const resent: unknown[] = [];
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ status: 403, json: { needsConfirmation: true } })
  );
  await page.route("**/api/auth/resend-confirmation", (route) => {
    resent.push(route.request().postDataJSON());
    return route.fulfill({ status: 202 });
  });

  await page.goto("/login");
  await page.getByLabel("E-post").fill("ny@budgex.se");
  await page.getByLabel("Lösenord").fill("Test1234!");
  await page.locator('button[type="submit"]').click();

  await expect(page.getByRole("alert")).toContainText("Bekräfta din e-post först");
  await page.getByRole("button", { name: "Skicka länken igen" }).click();

  await expect(page.getByRole("status")).toContainText("skickat en ny länk");
  expect(resent).toEqual([{ email: "ny@budgex.se" }]);
});

test("länken i mejlet bekräftar adressen", async ({ page }) => {
  const confirmed: unknown[] = [];
  await page.route("**/api/auth/confirm-email", (route) => {
    confirmed.push(route.request().postDataJSON());
    return route.fulfill({ status: 204 });
  });

  await page.goto("/confirm-email?email=ny%40budgex.se&token=123.abc");

  await expect(page.getByRole("status")).toHaveText("E-posten är bekräftad. Nu kan du logga in.");
  expect(confirmed[0]).toEqual({ email: "ny@budgex.se", token: "123.abc" });
});

test("en ogiltig bekräftelselänk förklarar vad man gör", async ({ page }) => {
  await page.route("**/api/auth/confirm-email", (route) => route.fulfill({ status: 400 }));

  await page.goto("/confirm-email?email=ny%40budgex.se&token=old");

  await expect(page.getByRole("alert")).toContainText("Länken är ogiltig eller har gått ut");
});
