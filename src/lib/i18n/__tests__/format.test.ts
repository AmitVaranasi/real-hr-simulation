import { describe, expect, it } from "vitest";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercent,
} from "../format";

describe("formatCurrency", () => {
  it("formats USD with English grouping/decimal conventions", () => {
    expect(formatCurrency(1_234_567, "en")).toBe("$1,234,567");
  });

  it("formats USD with Spanish grouping/decimal conventions", () => {
    // es-ES groups with "." and uses a non-breaking space before the
    // currency symbol; assert on the digit grouping, which is the part
    // that actually matters for reading a financial statement.
    const es = formatCurrency(1_234_567, "es");
    expect(es).toContain("1.234.567");
    expect(es).not.toBe(formatCurrency(1_234_567, "en"));
  });
});

describe("formatCompactCurrency", () => {
  it("abbreviates millions", () => {
    expect(formatCompactCurrency(42_900_000, "en")).toBe("$42.9M");
  });

  it("uses a comma decimal separator in Spanish", () => {
    const es = formatCompactCurrency(42_900_000, "es");
    expect(es).toContain("42,9");
    expect(es).not.toBe(formatCompactCurrency(42_900_000, "en"));
  });

  it("handles negative values with the sign before the currency symbol", () => {
    expect(formatCompactCurrency(-1_500_000, "en")).toBe("-$1.5M");
  });
});

describe("formatPercent", () => {
  it("differs in decimal separator between en and es", () => {
    const en = formatPercent(42.5, 1, "en");
    const es = formatPercent(42.5, 1, "es");
    expect(en).toBe("42.5%");
    expect(es).toContain("42,5");
    expect(en).not.toBe(es);
  });
});

describe("formatDate", () => {
  it("returns null for a missing value instead of throwing", () => {
    expect(formatDate(null, "en")).toBeNull();
    expect(formatDate(undefined, "en")).toBeNull();
  });

  it("returns null for an unparseable value", () => {
    expect(formatDate("not a date", "en")).toBeNull();
  });

  it("formats month names differently between en and es", () => {
    const en = formatDate("2026-07-31T00:00:00Z", "en", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    const es = formatDate("2026-07-31T00:00:00Z", "es", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    expect(en).toContain("July");
    expect(es).toContain("julio");
    expect(en).not.toBe(es);
  });
});
