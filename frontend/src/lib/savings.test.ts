import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { draftAmount, goalProgress } from "./savings";

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
    expect(result.eta).toBe("Målet är nått 🎉");
    expect(result.pct).toBe(100);
    expect(plain(result.text)).toBe("1 000 kr sparat");
  });

  it("räknar översparande som nått mål", () => {
    expect(goalProgress(1000, 1500, 500).done).toBe(true);
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
