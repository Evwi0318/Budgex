import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { draftAmount, fundingWarning, goalProgress, monthlyFromItems } from "./savings";

// Intl skiljer tusental med hårt mellanslag; testet ska inte falla på tecknet
const plain = (value: string) => value.replace(/[\u00a0\u202f]/g, " ");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-26T10:00:00"));
});

afterEach(() => vi.useRealTimers());

describe("draftAmount", () => {
  it("ger beloppet rakt av för en fast regel", () => {
    expect(draftAmount({ ruleType: "Fixed", value: 500 }, 25800)).toBe(500);
  });

  it("räknar procent på källans belopp och avrundar", () => {
    expect(draftAmount({ ruleType: "Percentage", value: 24 }, 25800)).toBe(6192);
    expect(draftAmount({ ruleType: "Percentage", value: 10 }, 25800)).toBe(2580);
  });

  it("avrundar procent nedåt som API:t", () => {
    expect(draftAmount({ ruleType: "Percentage", value: 10 }, 1009)).toBe(100);
  });

  it("ger 0 när källan gav 0", () => {
    expect(draftAmount({ ruleType: "Percentage", value: 24 }, 0)).toBe(0);
  });
});

describe("goalProgress", () => {
  it("räknar ut när målet nås", () => {
    const result = goalProgress(66000, 200, 2580);

    expect(result.eta).toBe("ungefär oktober 2028");
    expect(result.done).toBe(false);
    expect(plain(result.text)).toBe("200 kr av 66 000 kr");
  });

  it("flyttar fram datumet när månadsbeloppet höjs", () => {
    expect(goalProgress(66000, 200, 5676).eta).toBe("ungefär augusti 2027");
  });

  it("säger att målet är nått när det är nått", () => {
    const result = goalProgress(1000, 1000, 500);

    expect(result.done).toBe(true);
    expect(result.eta).toBe("Målet är nått");
    expect(result.pct).toBe(100);
    expect(plain(result.text)).toBe("1 000 kr sparat");
  });

  it("räknar översparande som nått mål och visar överskottet", () => {
    const result = goalProgress(1000, 1500, 500);

    expect(result.done).toBe(true);
    expect(plain(result.text)).toBe("1 500 kr sparat, 500 kr över målet");
  });

  it("säger 'inget avsatt' när ingen källa är vald", () => {
    const result = goalProgress(1000, 200, 0);

    expect(result.eta).toBe("inget avsatt");
    expect(result.nextPct).toBe(0);
    expect(plain(result.text)).toBe("200 kr av 1 000 kr");
  });

  it("låter de två segmenten aldrig gå över 100", () => {
    const result = goalProgress(1000, 900, 500);

    expect(result.pct).toBe(90);
    expect(result.nextPct).toBe(10);
  });
});

describe("monthlyFromItems", () => {
  const item = (yearlyAmount: number) => ({ name: "Post", yearlyAmount, dueMonth: 4 });

  it("delar årssumman på tolv", () => {
    expect(monthlyFromItems([item(1800), item(600)])).toBe(200);
  });

  it("avrundar uppåt så att året täcks", () => {
    expect(monthlyFromItems([item(1000)])).toBe(84);
  });
});

describe("fundingWarning", () => {
  const summary = { income: 12000, totalExpenses: 10000, totalSavings: 1000, safeToSpend: 1000 };
  const salary = { sourceEntryId: "s", name: "Lön", available: 20000, allocated: 0, status: "Ok" as const };

  it("är tom när planen går ihop", () => {
    expect(fundingWarning(summary, [salary])).toBeNull();
  });

  it("visar exakt hur mycket planen överstiger inkomsten", () => {
    const warning = fundingWarning({ ...summary, safeToSpend: -2000 }, [salary]);

    expect(plain(warning ?? "")).toBe("Planen överstiger inkomsten med 2 000 kr.");
  });

  it("visar överskottet för en överfördelad källa", () => {
    const over = { ...salary, allocated: 24000, status: "Over" as const };

    expect(plain(fundingWarning(summary, [over]) ?? "")).toBe("Lön är överfördelad med 4 000 kr.");
  });
});
