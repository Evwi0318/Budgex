import { describe, expect, it } from "vitest";
import { formatKr, formatKrShort } from "./format";

describe("formatKrShort", () => {
  it("visar hela talet under en miljon", () => {
    expect(formatKrShort(999_999)).toBe(formatKr(999_999));
    expect(formatKrShort(0)).toBe(formatKr(0));
  });

  it("kapar talet i stället för att avrunda uppåt", () => {
    expect(formatKrShort(1_376_678)).toBe("1,3 mn kr");
    expect(formatKrShort(1_999_999)).toBe("1,9 mn kr");
    expect(formatKrShort(2_500_000)).toBe("2,5 mn kr");
  });

  it("skriver jämna miljoner utan decimal", () => {
    expect(formatKrShort(1_000_000)).toBe("1 mn kr");
    expect(formatKrShort(10_000_000)).toBe("10 mn kr");
  });

  it("kapar mot noll även när talet är negativt", () => {
    expect(formatKrShort(-1_376_678)).toMatch(/1,3 mn kr$/);
    expect(formatKrShort(-1_376_678)).not.toMatch(/1,4/);
  });
});
