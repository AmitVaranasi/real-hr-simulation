import { describe, expect, it } from "vitest";
import { checkDailyCap, utcDayStart, DAILY_MESSAGE_CAP } from "@/lib/coach/rate-limit";

describe("checkDailyCap", () => {
  it("allows messages under the limit", () => {
    const result = checkDailyCap(5, 20);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(15);
  });

  it("blocks once usage reaches the limit", () => {
    const result = checkDailyCap(20, 20);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("blocks usage beyond the limit and never reports negative remaining", () => {
    const result = checkDailyCap(25, 20);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("defaults to DAILY_MESSAGE_CAP when no limit is passed", () => {
    const result = checkDailyCap(0);
    expect(result.limit).toBe(DAILY_MESSAGE_CAP);
  });
});

describe("utcDayStart", () => {
  it("returns midnight UTC for the given date", () => {
    const d = new Date("2026-09-18T23:59:59.000Z");
    expect(utcDayStart(d)).toBe("2026-09-18T00:00:00.000Z");
  });

  it("is stable across times within the same UTC day", () => {
    const morning = utcDayStart(new Date("2026-09-18T01:00:00.000Z"));
    const evening = utcDayStart(new Date("2026-09-18T23:00:00.000Z"));
    expect(morning).toBe(evening);
  });

  it("rolls over at the UTC day boundary", () => {
    const before = utcDayStart(new Date("2026-09-18T23:59:59.999Z"));
    const after = utcDayStart(new Date("2026-09-19T00:00:00.000Z"));
    expect(before).not.toBe(after);
  });
});
