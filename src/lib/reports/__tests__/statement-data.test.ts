import { describe, it, expect } from "vitest";
import {
  formatRoundDate,
  formatAsOfDate,
  mapOutcomesToRounds,
  scaleByRevenue,
  FIGMA_PL,
} from "../statement-data";

describe("formatRoundDate", () => {
  it("formats a valid ISO date string with time component to short date format", () => {
    // NOTE: suspected bug — ISO date strings without timezone (e.g., "2026-01-15")
    // are parsed as UTC, then converted to local time, causing off-by-one issues.
    // Using explicit Z suffix avoids this. new Date("not-a-date") doesn't throw;
    // it creates an Invalid Date, which toLocaleDateString formats as "Invalid Date"
    // rather than returning "—" as intended by the catch block.
    const result = formatRoundDate("2026-06-30T14:30:00Z");
    expect(result).toMatch(/\w+ \d{1,2}, 2026/);
  });

  it("formats a noon UTC date string correctly", () => {
    // Using noon UTC ensures the date stays the same across UTC-8 timezone
    // 2026-01-15T12:00:00Z displays as Jan 15, 2026 even in UTC-8
    const result = formatRoundDate("2026-01-15T12:00:00Z");
    expect(result).toBe("Jan 15, 2026");
  });

  it("returns dash for null", () => {
    expect(formatRoundDate(null)).toBe("—");
  });

  it("returns dash for undefined", () => {
    expect(formatRoundDate(undefined)).toBe("—");
  });

  it("returns dash for empty string", () => {
    expect(formatRoundDate("")).toBe("—");
  });

  it("returns dash for an invalid date string", () => {
    // Previously a bug: new Date("not-a-date") creates an Invalid Date
    // object without throwing, so a plain toLocaleDateString() call
    // rendered the literal string "Invalid Date" instead of "—". The
    // shared formatDate() helper (src/lib/i18n/format.ts) now checks
    // Number.isNaN(date.getTime()) explicitly, fixing this for every
    // caller, not just this one.
    expect(formatRoundDate("not-a-date")).toBe("—");
  });

  it("handles valid date formats with Z suffix", () => {
    const result = formatRoundDate("2025-12-31T12:00:00Z");
    expect(result).toBe("Dec 31, 2025");
  });
});

describe("formatAsOfDate", () => {
  it("formats a valid ISO date string with UTC timezone to long date format", () => {
    const result = formatAsOfDate("2026-06-30T14:30:00Z");
    expect(result).toMatch(/\w+ \d{1,2}, 2026/);
  });

  it("formats a noon UTC date string correctly", () => {
    // Using noon UTC ensures the date stays the same across UTC-8 timezone
    // 2026-01-15T12:00:00Z displays as January 15, 2026 even in UTC-8
    const result = formatAsOfDate("2026-01-15T12:00:00Z");
    expect(result).toBe("January 15, 2026");
  });

  it("returns default date for null", () => {
    expect(formatAsOfDate(null)).toBe("July 31, 2026");
  });

  it("returns default date for undefined", () => {
    expect(formatAsOfDate(undefined)).toBe("July 31, 2026");
  });

  it("returns default date for empty string", () => {
    expect(formatAsOfDate("")).toBe("July 31, 2026");
  });

  it("returns the default date for an invalid date string", () => {
    // Previously a bug (see the matching note in the formatRoundDate
    // suite above) — now correctly falls back to the default.
    expect(formatAsOfDate("invalid-date")).toBe("July 31, 2026");
  });

  it("uses full month name in output", () => {
    // Using noon UTC to stay within the same day across timezone conversions
    const result = formatAsOfDate("2026-03-21T12:00:00Z");
    expect(result).toBe("March 21, 2026");
  });

  it("formats December correctly", () => {
    // Using noon UTC to stay within the same day across timezone conversions
    const result = formatAsOfDate("2025-12-25T12:00:00Z");
    expect(result).toBe("December 25, 2025");
  });
});

describe("mapOutcomesToRounds", () => {
  it("maps a single outcome to FinancialRoundItem", () => {
    const outcomes = [
      {
        id: 1,
        round_id: "r123",
        computed_at: "2026-01-15T12:00:00Z",
        rounds: {
          id: "round-abc",
          round_number: 1,
          closed_at: "2026-01-15T12:00:00Z",
        },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "1",
      roundId: "r123",
      roundNumber: 1,
      dateLabel: "Jan 15, 2026",
      href: "/reports?round=r123",
    });
  });

  it("returns empty array for empty input", () => {
    const result = mapOutcomesToRounds([], "/reports");
    expect(result).toHaveLength(0);
  });

  it("uses round_id when present, ignoring rounds.id", () => {
    const outcomes = [
      {
        id: 2,
        round_id: "preferred-id",
        computed_at: "2026-02-01T12:00:00Z",
        rounds: {
          id: "fallback-id",
          round_number: 2,
          closed_at: "2026-02-01T12:00:00Z",
        },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    expect(result[0].roundId).toBe("preferred-id");
    expect(result[0].href).toBe("/reports?round=preferred-id");
  });

  it("falls back to rounds.id when round_id is missing", () => {
    const outcomes = [
      {
        id: 3,
        round_id: null,
        computed_at: "2026-03-01T12:00:00Z",
        rounds: {
          id: "fallback-round",
          round_number: 3,
          closed_at: "2026-03-01T12:00:00Z",
        },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    expect(result[0].roundId).toBe("fallback-round");
  });

  it("uses empty string for roundId when both round_id and rounds.id are missing", () => {
    const outcomes = [
      {
        id: 4,
        round_id: null,
        computed_at: "2026-04-01T12:00:00Z",
        rounds: null,
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    expect(result[0].roundId).toBe("");
  });

  it("uses 0 for roundNumber when rounds is null", () => {
    const outcomes = [
      {
        id: 5,
        round_id: "r999",
        computed_at: "2026-05-01T12:00:00Z",
        rounds: null,
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    expect(result[0].roundNumber).toBe(0);
  });

  it("prefers closed_at over computed_at for date label", () => {
    const outcomes = [
      {
        id: 6,
        round_id: "r666",
        computed_at: "2026-12-31T12:00:00Z",
        rounds: {
          id: "ignored",
          round_number: 6,
          closed_at: "2026-02-01T12:00:00Z",
        },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    // closed_at (2026-02-01) should be used, not computed_at (2026-12-31)
    expect(result[0].dateLabel).toBe("Feb 1, 2026");
  });

  it("falls back to computed_at when closed_at is null", () => {
    const outcomes = [
      {
        id: 7,
        round_id: "r777",
        computed_at: "2026-07-15T12:00:00Z",
        rounds: {
          id: "r777",
          round_number: 7,
          closed_at: null,
        },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    expect(result[0].dateLabel).toBe("Jul 15, 2026");
  });

  it("returns dash dateLabel when both closed_at and computed_at are null", () => {
    const outcomes = [
      {
        id: 8,
        round_id: "r888",
        computed_at: null,
        rounds: {
          id: "r888",
          round_number: 8,
          closed_at: null,
        },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    expect(result[0].dateLabel).toBe("—");
  });

  it("casts id to string", () => {
    const outcomes = [
      {
        id: 999,
        round_id: "r999",
        computed_at: "2026-09-01",
        rounds: {
          id: "r999",
          round_number: 1,
          closed_at: "2026-09-01",
        },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    expect(result[0].id).toBe("999");
    expect(typeof result[0].id).toBe("string");
  });

  it("handles multiple outcomes in sequence", () => {
    const outcomes = [
      {
        id: 1,
        round_id: "r1",
        computed_at: "2026-01-01T12:00:00Z",
        rounds: {
          id: "r1",
          round_number: 1,
          closed_at: "2026-01-01T12:00:00Z",
        },
      },
      {
        id: 2,
        round_id: "r2",
        computed_at: "2026-02-01T12:00:00Z",
        rounds: {
          id: "r2",
          round_number: 2,
          closed_at: "2026-02-01T12:00:00Z",
        },
      },
      {
        id: 3,
        round_id: "r3",
        computed_at: "2026-03-01T12:00:00Z",
        rounds: {
          id: "r3",
          round_number: 3,
          closed_at: "2026-03-01T12:00:00Z",
        },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/reports");

    expect(result).toHaveLength(3);
    expect(result[0].roundNumber).toBe(1);
    expect(result[1].roundNumber).toBe(2);
    expect(result[2].roundNumber).toBe(3);
  });

  it("includes basePath in href correctly", () => {
    const outcomes = [
      {
        id: 1,
        round_id: "rid",
        computed_at: "2026-01-01T12:00:00Z",
        rounds: { id: "rid", round_number: 1, closed_at: "2026-01-01T12:00:00Z" },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/admin/financials");

    expect(result[0].href).toBe("/admin/financials?round=rid");
  });

  it("handles basePath with trailing slash", () => {
    const outcomes = [
      {
        id: 1,
        round_id: "rid",
        computed_at: "2026-01-01T12:00:00Z",
        rounds: { id: "rid", round_number: 1, closed_at: "2026-01-01T12:00:00Z" },
      },
    ];
    const result = mapOutcomesToRounds(outcomes, "/admin/");

    expect(result[0].href).toBe("/admin/?round=rid");
  });
});

describe("scaleByRevenue", () => {
  it("returns 1 when liveRevenue equals FIGMA_PL.revenue", () => {
    const scale = scaleByRevenue(FIGMA_PL.revenue);
    expect(scale).toBe(1);
  });

  it("returns scale factor > 1 when liveRevenue exceeds FIGMA_PL.revenue", () => {
    const liveRevenue = FIGMA_PL.revenue * 2;
    const scale = scaleByRevenue(liveRevenue);
    expect(scale).toBe(2);
  });

  it("returns scale factor < 1 when liveRevenue is below FIGMA_PL.revenue", () => {
    const liveRevenue = FIGMA_PL.revenue / 2;
    const scale = scaleByRevenue(liveRevenue);
    expect(scale).toBe(0.5);
  });

  it("returns 1 when liveRevenue is 0", () => {
    const scale = scaleByRevenue(0);
    expect(scale).toBe(1);
  });

  it("returns 1 when liveRevenue is null", () => {
    const scale = scaleByRevenue(null);
    expect(scale).toBe(1);
  });

  it("returns 1 when liveRevenue is undefined", () => {
    const scale = scaleByRevenue(undefined);
    expect(scale).toBe(1);
  });

  it("returns 1 when liveRevenue is negative", () => {
    const scale = scaleByRevenue(-1000);
    expect(scale).toBe(1);
  });

  it("handles fractional scaling correctly", () => {
    const liveRevenue = FIGMA_PL.revenue * 1.5;
    const scale = scaleByRevenue(liveRevenue);
    expect(scale).toBeCloseTo(1.5, 5);
  });

  it("returns correct scale for arbitrary positive revenue", () => {
    const liveRevenue = 25_058_500; // Half of FIGMA_PL.revenue
    const scale = scaleByRevenue(liveRevenue);
    expect(scale).toBeCloseTo(liveRevenue / FIGMA_PL.revenue, 10);
  });

  it("treats very small positive revenue as legitimate (not zero-fallback)", () => {
    const liveRevenue = 1;
    const scale = scaleByRevenue(liveRevenue);
    expect(scale).toBe(1 / FIGMA_PL.revenue);
    expect(scale).toBeLessThan(0.00001);
  });

  it("FIGMA_PL.revenue is the base value used for scaling", () => {
    // This test pins the base value used in the calculation
    expect(FIGMA_PL.revenue).toBe(50_117_000);
    const scale = scaleByRevenue(50_117_000);
    expect(scale).toBe(1);
  });
});
