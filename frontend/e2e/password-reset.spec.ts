import { expect, test } from "@playwright/test";
import { mockApi } from "./app";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401 }));
});

test("glömt lösenord skickar en länk och avslöjar inte om kontot finns", async ({ page }) => {
  const requests: unknown[] = [];
  await page.route("**/api/auth/forgot-password", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ status: 202 });
  });

  await page.goto("/login");
  await page.getByRole("link", { name: "Glömt lösenordet?" }).click();
  // Inloggningen har också ett e-postfält; fyll i först när sidbytet är klart
  await expect(page.getByRole("heading", { name: "Glömt lösenordet?" })).toBeVisible();
  await page.getByLabel("E-post").fill("evan@budgex.se");
  await page.getByRole("button", { name: "Skicka länk" }).click();

  await expect(page.getByRole("status")).toContainText("Om det finns ett konto för evan@budgex.se");
  expect(requests).toEqual([{ email: "evan@budgex.se" }]);
});

test("länken i mejlet byter lösenord och loggar in", async ({ page }) => {
  const resets: unknown[] = [];
  await page.route("**/api/auth/reset-password", (route) => {
    resets.push(route.request().postDataJSON());
    return route.fulfill({ status: 204 });
  });
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ json: { accessToken: "test-token" } })
  );

  await page.goto("/reset-password?email=evan%40budgex.se&token=123.abc");
  await page.getByLabel("Nytt lösenord").fill("Brandnew1!");
  await page.getByRole("button", { name: "Spara nytt lösenord" }).click();

  await page.getByRole("button", { name: /^Utgifter/ }).waitFor();
  expect(resets).toEqual([{ email: "evan@budgex.se", token: "123.abc", newPassword: "Brandnew1!" }]);
});

test("en gammal länk förklarar vad som hänt", async ({ page }) => {
  await page.route("**/api/auth/reset-password", (route) =>
    route.fulfill({ status: 400, json: { message: "Länken är ogiltig eller har gått ut. Begär en ny." } })
  );

  await page.goto("/reset-password?email=evan%40budgex.se&token=old");
  await page.getByLabel("Nytt lösenord").fill("Brandnew1!");
  await page.getByRole("button", { name: "Spara nytt lösenord" }).click();

  await expect(page.getByRole("alert")).toHaveText("Länken är ogiltig eller har gått ut. Begär en ny.");
});

test("utan e-posttjänst visas ingen återställningslänk", async ({ page }) => {
  await page.route("**/api/auth/options", (route) => route.fulfill({ json: { passwordReset: false } }));

  await page.goto("/login");
  await expect(page.getByLabel("Lösenord")).toBeVisible();

  await expect(page.getByRole("link", { name: "Glömt lösenordet?" })).toHaveCount(0);
});
