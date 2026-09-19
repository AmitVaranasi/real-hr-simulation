import { describe, expect, it } from "vitest";
import { buildPreview, type PreviewRow } from "../preview";

const VARS = ["turnover_rate", "employee_satisfaction"];

const ROWS: PreviewRow[] = [
  {
    label: "Team A — Round 1",
    variables: { turnover_rate: 12, employee_satisfaction: 70 },
    currentValue: 12,
  },
  {
    label: "Team B — Round 1",
    variables: { turnover_rate: 20, employee_satisfaction: 50 },
    currentValue: 20,
  },
];

describe("buildPreview", () => {
  it("returns a compile error and no rows when the expression is invalid", () => {
    const result = buildPreview("turnover_rate +", VARS, ROWS);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.rows).toEqual([]);
  });

  it("returns a compile error for an unknown variable", () => {
    const result = buildPreview("bogus + 1", VARS, ROWS);
    expect(result.ok).toBe(false);
  });

  it("evaluates each row and computes the delta against the current value", () => {
    const result = buildPreview(
      "clamp(turnover_rate - 2, 0, 100)",
      VARS,
      ROWS
    );
    expect(result.ok).toBe(true);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      label: "Team A — Round 1",
      currentValue: 12,
      editedValue: 10,
      delta: -2,
      editedError: null,
    });
    expect(result.rows[1]).toMatchObject({
      currentValue: 20,
      editedValue: 18,
      delta: -2,
    });
  });

  it("reports a per-row runtime error without failing the whole preview", () => {
    const rows: PreviewRow[] = [
      { label: "Zero row", variables: { turnover_rate: 0, employee_satisfaction: 1 }, currentValue: 0 },
    ];
    const result = buildPreview("100 / turnover_rate", VARS, rows);
    expect(result.ok).toBe(true);
    expect(result.rows[0].editedError).toMatch(/[Dd]ivision by zero/);
    expect(result.rows[0].editedValue).toBeNull();
  });

  it("reports a missing-value row without throwing", () => {
    const rows: PreviewRow[] = [
      {
        label: "Incomplete row",
        variables: { turnover_rate: null, employee_satisfaction: 50 },
        currentValue: null,
      },
    ];
    const result = buildPreview("turnover_rate + employee_satisfaction", VARS, rows);
    expect(result.ok).toBe(true);
    expect(result.rows[0].editedValue).toBeNull();
    expect(result.rows[0].editedError).toMatch(/turnover_rate/);
  });

  it("leaves delta null when there is no recorded current value", () => {
    const rows: PreviewRow[] = [
      {
        label: "No baseline",
        variables: { turnover_rate: 5, employee_satisfaction: 60 },
        currentValue: null,
      },
    ];
    const result = buildPreview("turnover_rate", VARS, rows);
    expect(result.rows[0].delta).toBeNull();
    expect(result.rows[0].editedValue).toBe(5);
  });

  it("handles an empty row set", () => {
    const result = buildPreview("turnover_rate", VARS, []);
    expect(result.ok).toBe(true);
    expect(result.rows).toEqual([]);
  });

  it("never throws on a hostile expression against many rows", () => {
    const manyRows: PreviewRow[] = Array.from({ length: 500 }, (_, i) => ({
      label: `Row ${i}`,
      variables: { turnover_rate: i, employee_satisfaction: i },
      currentValue: i,
    }));
    expect(() => buildPreview("__proto__ + constructor", VARS, manyRows)).not.toThrow();
    const result = buildPreview("__proto__ + constructor", VARS, manyRows);
    expect(result.ok).toBe(false);
  });
});
