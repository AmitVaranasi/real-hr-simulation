import { describe, expect, it } from "vitest";
import { cn, formatCurrency, formatCompactCurrency, formatPercent, clamp } from "../utils";

describe("cn", () => {
  it("merges tailwind classes, letting the later one win a conflict", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("formatCurrency", () => {
  it("formats whole USD with no decimals", () => {
    expect(formatCurrency(42900000)).toBe("$42,900,000");
  });

  it("rounds fractional cents away", () => {
    expect(formatCurrency(1.6)).toBe("$2");
  });
});

describe("formatCompactCurrency", () => {
  it("compacts billions, millions, and thousands with the right suffix", () => {
    expect(formatCompactCurrency(2_500_000_000)).toBe("$2.5B");
    expect(formatCompactCurrency(42_900_000)).toBe("$42.9M");
    expect(formatCompactCurrency(15_000)).toBe("$15.0K");
  });

  it("falls back to formatCurrency below the 10K compaction threshold", () => {
    expect(formatCompactCurrency(9_999)).toBe(formatCurrency(9_999));
    expect(formatCompactCurrency(500)).toBe("$500");
  });

  it("preserves the negative sign for negative values", () => {
    expect(formatCompactCurrency(-2_500_000)).toBe("-$2.5M");
  });

  it("treats zero as below threshold, not a NaN division", () => {
    expect(formatCompactCurrency(0)).toBe("$0");
  });
});

describe("formatPercent", () => {
  it("defaults to one decimal place", () => {
    expect(formatPercent(12.345)).toBe("12.3%");
  });

  it("respects an explicit decimals count", () => {
    expect(formatPercent(12.345, 0)).toBe("12%");
    expect(formatPercent(12.345, 2)).toBe("12.35%");
  });
});

describe("clamp", () => {
  it("passes through values inside the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min and max at the boundaries", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles an inverted min/max by favoring min (Math.max wins)", () => {
    // NOTE: suspected bug — clamp(value, min, max) with min > max does not
    // throw or normalize; Math.max(min, Math.min(max, value)) always
    // resolves to `min` for any input once min > max, silently ignoring max.
    expect(clamp(5, 10, 0)).toBe(10);
  });
});
