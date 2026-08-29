import type { Page, Route } from "@playwright/test";

export type Kind = "Income" | "Expense";
export type RuleType = "Fixed" | "Percentage";

export interface Entry {
  id: string;
  kind: Kind;
  name: string;
  category: string;
  amount: number;
  isAutogiro: boolean;
  isPaid: boolean;
  repeats: boolean;
}

export interface Rule {
  sourceEntryId: string;
  ruleType: RuleType;
  value: number;
}

export interface Account {
  id: string;
  name: string;
  icon: string;
  goal: number | null;
  saved: number | null;
  isTransferred: boolean;
  rules: Rule[];
}

export interface Seed {
  income: Entry[];
  expenses: Entry[];
  accounts: Account[];
}

const expense = (
  id: string,
  name: string,
  amount: number,
  extra: Partial<Entry> = {}
): Entry => ({
  id,
  kind: "Expense",
  name,
  category: "Other",
  amount,
  isAutogiro: false,
  isPaid: false,
  repeats: true,
  ...extra,
});

/**
 * 2 obetalda manuella utgifter (3 600 kr) plus ett autogiro som aldrig räknas,
 * och två sparkonton så att både "markera alla" och "N överförda" går att nå.
 */
export const defaultSeed = (): Seed => ({
  income: [
    {
      id: "i1",
      kind: "Income",
      name: "Lön",
      category: "Salary",
      amount: 25800,
      isAutogiro: false,
      isPaid: false,
      repeats: true,
    },
  ],
  expenses: [
    expense("e1", "Hyra", 4000, { category: "Housing", isAutogiro: true }),
    expense("e2", "Elräkning", 1200, { category: "Bills" }),
    expense("e3", "Mat", 2400, { category: "Food", repeats: false }),
  ],
  accounts: [
    {
      id: "s1",
      name: "Buffert",
      icon: "🐷",
      goal: 66000,
      saved: 200,
      isTransferred: false,
      rules: [{ sourceEntryId: "i1", ruleType: "Percentage", value: 10 }],
    },
    {
      id: "s2",
      name: "Resa",
      icon: "✈️",
      goal: null,
      saved: null,
      isTransferred: false,
      rules: [{ sourceEntryId: "i1", ruleType: "Fixed", value: 500 }],
    },
  ],
});

const ruleAmount = (rule: Rule, income: Entry[]) => {
  const source = income.find((entry) => entry.id === rule.sourceEntryId);
  const available = source?.amount ?? 0;

  return {
    ...rule,
    sourceName: source?.name ?? "",
    amount:
      rule.ruleType === "Fixed"
        ? rule.value
        : Math.round((available * rule.value) / 100),
  };
};

const accountDto = (account: Account, income: Entry[]) => {
  const rules = account.rules.map((rule) => ruleAmount(rule, income));

  return {
    ...account,
    rules,
    amount: rules.reduce((sum, rule) => sum + rule.amount, 0),
  };
};

/**
 * Svarar på hela API:t ur minnet. Varje månad som efterfrågas får en egen
 * kopia av seeden, så månadsbläddring ger samma innehåll varje gång och
 * ändringar i en månad läcker inte till en annan.
 */
export async function mockApi(page: Page, overrides: Partial<Seed> = {}) {
  const seed = { ...defaultSeed(), ...overrides };
  const months = new Map<string, Seed>();
  let nextId = 0;

  const monthOf = (key: string) => {
    if (!months.has(key)) months.set(key, structuredClone(seed));
    return months.get(key)!;
  };

  const savingsBody = (year: string, month: string) => {
    const data = monthOf(`${year}-${month}`);
    const accounts = data.accounts.map((item) => accountDto(item, data.income));

    return {
      year: Number(year),
      month: Number(month),
      total: accounts.reduce((sum, item) => sum + item.amount, 0),
      accounts,
      sources: data.income.map((source) => {
        const allocated = accounts
          .flatMap((item) => item.rules)
          .filter((rule) => rule.sourceEntryId === source.id)
          .reduce((sum, rule) => sum + rule.amount, 0);

        return {
          sourceEntryId: source.id,
          name: source.name,
          available: source.amount,
          allocated,
          status:
            allocated > source.amount
              ? "Over"
              : allocated === source.amount
                ? "Full"
                : "Ok",
        };
      }),
    };
  };

  const planBody = (year: string, month: string) => {
    const data = monthOf(`${year}-${month}`);
    const income = data.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalSavings = savingsBody(year, month).total;

    return {
      year: Number(year),
      month: Number(month),
      income: data.income,
      expenses: data.expenses,
      summary: {
        income,
        totalExpenses,
        totalSavings,
        safeToSpend: income - totalExpenses - totalSavings,
      },
    };
  };

  await page.route("**/api/**", async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    // Sidan och API:t ligger på olika portar, så svaren måste bära CORS själva
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "access-control-allow-origin": request.headers()["origin"] ?? "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    };

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }

    const send = (body: unknown, status = 200) =>
      route.fulfill({ status, headers, body: JSON.stringify(body) });

    const body = method === "GET" ? null : request.postDataJSON();

    if (path === "/api/auth/refresh") return send({ accessToken: "test-token" });
    if (path === "/api/auth/logout") return send({});
    if (path === "/api/profile" && method === "GET") {
      return send({ email: "evan@budgex.test", name: "Evan Test" });
    }

    const paid = path.match(/^\/api\/months\/(\d+)\/(\d+)\/entries\/([^/]+)\/paid$/);
    if (paid) {
      const data = monthOf(`${paid[1]}-${paid[2]}`);
      const entry = [...data.income, ...data.expenses].find((item) => item.id === paid[3]);
      if (entry) entry.isPaid = body.isPaid;
      return send({});
    }

    const one = path.match(/^\/api\/months\/(\d+)\/(\d+)\/entries\/([^/]+)$/);
    if (one) {
      const data = monthOf(`${one[1]}-${one[2]}`);

      if (method === "DELETE") {
        data.income = data.income.filter((item) => item.id !== one[3]);
        data.expenses = data.expenses.filter((item) => item.id !== one[3]);
        return send({});
      }

      const entry = [...data.income, ...data.expenses].find((item) => item.id === one[3]);
      if (entry) Object.assign(entry, body);
      return send({});
    }

    const entries = path.match(/^\/api\/months\/(\d+)\/(\d+)\/entries$/);
    if (entries) {
      if (method === "GET") return send(planBody(entries[1], entries[2]));

      const data = monthOf(`${entries[1]}-${entries[2]}`);
      const created: Entry = { ...body, id: `n${++nextId}`, isPaid: false };
      if (created.kind === "Income") data.income.push(created);
      else data.expenses.push(created);
      return send({});
    }

    const all = path.match(/^\/api\/months\/(\d+)\/(\d+)\/savings\/transferred$/);
    if (all) {
      monthOf(`${all[1]}-${all[2]}`).accounts.forEach((account) => {
        account.isTransferred = body.isTransferred;
      });
      return send({});
    }

    const transfer = path.match(
      /^\/api\/months\/(\d+)\/(\d+)\/savings\/([^/]+)\/transferred$/
    );
    if (transfer) {
      const account = monthOf(`${transfer[1]}-${transfer[2]}`).accounts.find(
        (item) => item.id === transfer[3]
      );
      if (account) account.isTransferred = body.isTransferred;
      return send({});
    }

    const account = path.match(/^\/api\/months\/(\d+)\/(\d+)\/savings\/([^/]+)$/);
    if (account) {
      const data = monthOf(`${account[1]}-${account[2]}`);

      if (method === "DELETE") {
        data.accounts = data.accounts.filter((item) => item.id !== account[3]);
        return send({});
      }

      const found = data.accounts.find((item) => item.id === account[3]);
      if (found) Object.assign(found, body);
      return send({});
    }

    const savings = path.match(/^\/api\/months\/(\d+)\/(\d+)\/savings$/);
    if (savings) {
      if (method === "GET") return send(savingsBody(savings[1], savings[2]));

      monthOf(`${savings[1]}-${savings[2]}`).accounts.push({
        ...body,
        id: `n${++nextId}`,
        isTransferred: false,
      });
      return send({});
    }

    return send({}, 404);
  });
}

/** Refresh ger en token, så appen går direkt in utan inloggningssteg */
export async function openApp(page: Page, overrides: Partial<Seed> = {}) {
  await mockApi(page, overrides);
  await page.goto("/");
  await page.getByRole("button", { name: /^Utgifter/ }).waitFor();
}

export const openExpenses = (page: Page) =>
  page.getByRole("button", { name: /^Utgifter/ }).click();

export const openIncome = (page: Page) =>
  page.getByRole("button", { name: /^Inkomst/ }).click();

/** Enda stället som vet HUR man når sparandet — numera en flik i hero-kortet */
export const openSavings = (page: Page) =>
  page.getByRole("button", { name: /^Sparande/ }).click();

/**
 * Raden runt en post. Selektorn utgår från namnet och inte från ordningen,
 * så den håller även när listan filtreras om.
 */
export const entryRow = (page: Page, name: string) =>
  page.getByRole("button", { name: `Öppna ${name}` }).locator("xpath=..");

export const paidBox = (page: Page, name: string) =>
  entryRow(page, name).getByRole("button", { name: /^Markera som/ });

/** Gula raden ovanför utgiftslistan, eller den gröna när allt är betalt */
export const paymentRow = (page: Page) =>
  page.getByText(/kvar att betala själv|Allt är betalt i/);

/**
 * Arket ligger kvar i DOM:en medan det animerar ut, så det räcker inte att
 * fråga efter role=dialog — dialogen måste pekas ut på sitt innehåll.
 */
export const dialog = (page: Page, text: string | RegExp) =>
  page.getByRole("dialog").filter({ hasText: text });

export const prevMonth = (page: Page) =>
  page.getByRole("button", { name: "Föregående månad" });

export const nextMonth = (page: Page) =>
  page.getByRole("button", { name: "Nästa månad" });

export const fab = (page: Page, label: string) =>
  page.getByRole("button", { name: label });

export const manyExpenses = (count: number): Entry[] =>
  Array.from({ length: count }, (_, index) =>
    expense(`m${index + 1}`, `Utgift ${String(index + 1).padStart(2, "0")}`, 100 + index, {
      isAutogiro: true,
    })
  );

/**
 * Riktiga touch-event via CDP. Mus och finger beter sig olika: pointer capture
 * flyttas, lostpointercapture bubblar, och touch-action avgör om webbläsaren
 * tar över gesten. Gester måste därför testas som de faktiskt används.
 */
export async function touchDrag(
  page: Page,
  from: { x: number; y: number },
  dx: number,
  dy = 0,
  steps = 10
) {
  const cdp = await page.context().newCDPSession(page);

  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: from.x, y: from.y }],
  });

  for (let step = 1; step <= steps; step++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: from.x + (dx * step) / steps, y: from.y + (dy * step) / steps },
      ],
    });
    await page.waitForTimeout(16);
  }

  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}
