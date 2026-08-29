import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { fab, openApp, touchDrag } from "./app";

const gaeller = (page: Page) =>
  page
    .getByRole("dialog")
    .filter({ hasText: "Ny utgift" })
    .getByRole("button", { name: "Varje månad" })
    .locator("xpath=../..");

const swipe = async (control: Locator, page: Page, dx: number, steps: number) => {
  // Kontrollen ligger långt ned i arket och måste fram innan musen når den
  await control.scrollIntoViewIfNeeded();
  const box = (await control.boundingBox())!;
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  for (let step = 1; step <= steps; step++) {
    await page.mouse.move(box.x + box.width / 2 + (dx * step) / steps, y, {
      steps: 2,
    });
  }
  await page.mouse.up();
  await page.waitForTimeout(400);
};

/** Markeringen ska alltid ligga mitt på det valda alternativet */
const expectAligned = async (control: Locator) => {
  await control.scrollIntoViewIfNeeded();
  const pill = control.locator("span[aria-hidden]").first();
  const selected = control.getByRole("button", { pressed: true });

  await expect(selected).toHaveCount(1);

  const pillBox = (await pill.boundingBox())!;
  const selectedBox = (await selected.boundingBox())!;
  const trackBox = (await control.boundingBox())!;

  expect(
    Math.abs(
      pillBox.x + pillBox.width / 2 - (selectedBox.x + selectedBox.width / 2)
    )
  ).toBeLessThan(4);

  // Markeringen får aldrig hamna utanför spåret, inte ens en överslang
  expect(pillBox.x).toBeGreaterThanOrEqual(trackBox.x - 1);
  expect(pillBox.x + pillBox.width).toBeLessThanOrEqual(
    trackBox.x + trackBox.width + 1
  );
};

test.beforeEach(async ({ page }) => {
  await openApp(page);
  await fab(page, "Lägg till utgift").click();
  await expect(page.getByRole("dialog")).toContainText("Ny utgift");
});

test("svep åt höger väljer nästa alternativ", async ({ page }) => {
  const control = gaeller(page);

  await expect(control.getByRole("button", { name: /^Bara / })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await swipe(control, page, 70, 8);

  await expect(
    control.getByRole("button", { name: "Varje månad" })
  ).toHaveAttribute("aria-pressed", "true");
  await expectAligned(control);
});

test("ett snabbt svep fastnar inte halvvägs", async ({ page }) => {
  const control = gaeller(page);

  await swipe(control, page, 160, 2);
  await expectAligned(control);

  await swipe(control, page, -160, 2);
  await expectAligned(control);
});

test("en kort rörelse behåller valet", async ({ page }) => {
  const control = gaeller(page);

  await swipe(control, page, 12, 4);

  await expect(control.getByRole("button", { name: /^Bara / })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expectAligned(control);
});

test("en avbruten gest lämnar inte markeringen mitt emellan", async ({
  page,
}) => {
  const control = gaeller(page);
  await control.scrollIntoViewIfNeeded();
  const box = (await control.boundingBox())!;
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, y, { steps: 4 });

  await control.dispatchEvent("pointercancel");
  await page.mouse.up();
  await page.waitForTimeout(400);

  await expectAligned(control);
});

test("svep med finger väljer nästa alternativ", async ({ page }) => {
  const control = gaeller(page);
  await control.scrollIntoViewIfNeeded();

  const box = (await control.boundingBox())!;
  // Lite lodrätt drift, som en riktig tumme
  await touchDrag(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, 90, 6);
  await page.waitForTimeout(400);

  await expect(
    control.getByRole("button", { name: "Varje månad" })
  ).toHaveAttribute("aria-pressed", "true");
  await expectAligned(control);
});

test("finger­svep tillbaka väljer föregående alternativ", async ({ page }) => {
  const control = gaeller(page);
  await control.scrollIntoViewIfNeeded();

  const box = (await control.boundingBox())!;
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await touchDrag(page, centre, 90);
  await touchDrag(page, centre, -90);
  await page.waitForTimeout(400);

  await expect(control.getByRole("button", { name: /^Bara / })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expectAligned(control);
});
