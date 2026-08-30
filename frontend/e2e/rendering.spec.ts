import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { openApp } from "./app";

const willChange = (element: Locator) =>
  element.evaluate((el) => getComputedStyle(el).willChange);

/** Den dragbara delen av en rad, inte innehållet i den */
const draggable = (page: Page, name: string) =>
  page.getByRole("button", { name: `Öppna ${name}` }).locator("xpath=../..");

const deck = (page: Page) => page.locator("div.overflow-x-clip > div").first();

/**
 * will-change ger elementet ett eget lager hos kompositorn. Ligger det kvar
 * betalar man för lagret hela tiden — en lista med trettio rader blir trettio
 * lager. Det ska bara vara påslaget medan något faktiskt rör sig.
 */
test("rader har eget lager bara medan de dras", async ({ page }) => {
  await openApp(page);

  const row = draggable(page, "Elräkning");
  expect(await willChange(row)).toBe("auto");

  const box = (await row.boundingBox())!;
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width - 30, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 90, y, { steps: 5 });
  expect(await willChange(row)).toBe("transform");

  await page.mouse.up();
  await expect.poll(() => willChange(row)).toBe("auto");
});

test("flikdäcket har eget lager bara medan det sveps", async ({ page }) => {
  await openApp(page);

  expect(await willChange(deck(page))).toBe("auto");

  const hero = (await page.locator(".hero-card").boundingBox())!;
  const from = { x: hero.x + hero.width / 2, y: hero.y + hero.height / 2 };

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x - 80, from.y, { steps: 6 });
  expect(await willChange(deck(page))).toBe("transform");

  await page.mouse.up();
  await expect.poll(() => willChange(deck(page))).toBe("auto");
});

/**
 * En övergång på en layout-egenskap tvingar fram en omräkning av sidan varje
 * bildruta den löper. Hero-kortets komprimering är det enda stället där det är
 * medvetet — mätt till ett par millisekunder, och alternativet är att kortet
 * hoppar i storlek mitt i en scroll.
 */
test("inget utöver hero-kortet animerar layout", async ({ page }) => {
  await openApp(page);

  const offenders = await page.evaluate(() => {
    const layout = [
      "width", "height", "margin", "padding", "top", "left", "right", "bottom",
      "font-size", "line-height", "max-height", "min-height", "max-width",
      "min-width", "inset", "gap", "flex-basis",
    ];
    const found: string[] = [];

    for (const el of document.querySelectorAll<HTMLElement>("*")) {
      const style = getComputedStyle(el);
      const runs = style.transitionDuration
        .split(", ")
        .some((duration) => parseFloat(duration) > 0);
      if (!runs) continue;

      const animates = style.transitionProperty
        .split(", ")
        .filter((property) =>
          layout.some((name) => property === name || property.startsWith(`${name}-`))
        );

      const name = el.className.toString();
      if (animates.length && !name.includes("hero-")) {
        found.push(`${el.tagName}.${name.slice(0, 40)} => ${animates.join("|")}`);
      }
    }

    return found;
  });

  expect(offenders).toEqual([]);
});

/** transition-all sveper med bredd, höjd och marginal utan att man tänker på det */
test("ingen övergång står på all", async ({ page }) => {
  await openApp(page);

  const usingAll = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("*")].filter((el) => {
      const style = getComputedStyle(el);
      return (
        style.transitionProperty === "all" &&
        style.transitionDuration.split(", ").some((d) => parseFloat(d) > 0)
      );
    }).length
  );

  expect(usingAll).toBe(0);
});
