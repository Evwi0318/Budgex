import { afterEach, describe, expect, it, vi } from "vitest";
import { currentMonth, isFuture, isPast } from "./month";

const freeze = (iso: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
};

afterEach(() => vi.useRealTimers());

describe("currentMonth", () => {
  it("ger 1-baserad månad, som API:t", () => {
    freeze("2026-08-26T10:00:00");

    expect(currentMonth()).toEqual({ year: 2026, month: 8 });
  });
});

describe("isPast", () => {
  it("är sant för en tidigare månad", () => {
    freeze("2026-08-26T10:00:00");

    expect(isPast({ year: 2026, month: 7 })).toBe(true);
    expect(isPast({ year: 2025, month: 12 })).toBe(true);
  });

  it("är falskt för innevarande månad", () => {
    freeze("2026-08-26T10:00:00");

    expect(isPast({ year: 2026, month: 8 })).toBe(false);
  });

  it("är falskt för en kommande månad", () => {
    freeze("2026-08-26T10:00:00");

    expect(isPast({ year: 2026, month: 9 })).toBe(false);
  });

  it("håller över årsskiftet", () => {
    freeze("2026-01-05T10:00:00");

    expect(isPast({ year: 2025, month: 12 })).toBe(true);
    expect(isPast({ year: 2026, month: 1 })).toBe(false);
  });
});

describe("isFuture", () => {
  it("är sant bara för månader efter denna", () => {
    freeze("2026-08-26T10:00:00");

    expect(isFuture({ year: 2026, month: 9 })).toBe(true);
    expect(isFuture({ year: 2026, month: 8 })).toBe(false);
    expect(isFuture({ year: 2026, month: 7 })).toBe(false);
  });
});
