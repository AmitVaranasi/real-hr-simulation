import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClassExportData } from "@/lib/export/excel";

const bookNew = vi.fn(() => ({ __sheets: {} }));
const jsonToSheet = vi.fn((rows: unknown[]) => ({ rows }));
const appendedSheets: Array<{ name: string; rows: unknown[] }> = [];
const bookAppendSheet = vi.fn(
  (_wb: unknown, sheet: { rows: unknown[] }, name: string) => {
    appendedSheets.push({ name, rows: sheet.rows });
  }
);
const writeFile = vi.fn();

vi.mock("xlsx", () => ({
  utils: {
    book_new: bookNew,
    json_to_sheet: jsonToSheet,
    book_append_sheet: bookAppendSheet,
  },
  writeFile,
}));

const { generateClassExcel } = await import("@/lib/export/excel");

function sheet(name: string) {
  const found = appendedSheets.find((s) => s.name === name);
  if (!found) throw new Error(`sheet ${name} not appended`);
  return found.rows;
}

describe("generateClassExcel", () => {
  beforeEach(() => {
    appendedSheets.length = 0;
    jsonToSheet.mockClear();
    bookAppendSheet.mockClear();
    writeFile.mockClear();
  });

  const baseData: ClassExportData = {
    sessionName: "Fall Cohort",
    teams: [
      { id: "team-1", name: "Team A", industry: "Manufacturing", strategy: "Focus" },
      { id: "team-2", name: "Team B", industry: "Retail", strategy: "Innovation" },
    ],
    rounds: [
      { id: "round-1", round_number: 1, round_type: "practice" },
      { id: "round-2", round_number: 2, round_type: "competitive" },
      { id: "round-3", round_number: 3, round_type: "competitive" },
    ],
    outcomes: [
      { team_id: "team-1", round_id: "round-1", total_score: 60 },
      { team_id: "team-1", round_id: "round-2", total_score: 70 },
      { team_id: "team-1", round_id: "round-3", total_score: 90 },
    ],
    decisions: [],
    reflections: [],
  };

  it("writes one score column per round the team has an outcome for, keyed by round number", () => {
    generateClassExcel(baseData);
    const summary = sheet("Summary") as Array<Record<string, unknown>>;
    const teamA = summary.find((r) => r.Team === "Team A")!;
    expect(teamA["R1 Score"]).toBe(60);
    expect(teamA["R2 Score"]).toBe(70);
    expect(teamA["R3 Score"]).toBe(90);
  });

  it("averages only competitive-round scores into the Average column, excluding practice rounds", () => {
    generateClassExcel(baseData);
    const summary = sheet("Summary") as Array<Record<string, unknown>>;
    const teamA = summary.find((r) => r.Team === "Team A")!;
    // competitive rounds are round-2 (70) and round-3 (90) -> average 80; the
    // practice round (60) must not be included.
    expect(teamA.Average).toBe(80);
  });

  it("omits the Average column entirely for a team with no competitive-round outcomes", () => {
    generateClassExcel(baseData);
    const summary = sheet("Summary") as Array<Record<string, unknown>>;
    const teamB = summary.find((r) => r.Team === "Team B")!;
    expect(teamB.Average).toBeUndefined();
  });

  it("prefers instructor_override over total_score wherever a score is reported", () => {
    const data: ClassExportData = {
      ...baseData,
      outcomes: [
        {
          team_id: "team-1",
          round_id: "round-2",
          total_score: 70,
          instructor_override: 100,
        },
      ],
    };
    generateClassExcel(data);
    const summary = sheet("Summary") as Array<Record<string, unknown>>;
    const teamA = summary.find((r) => r.Team === "Team A")!;
    expect(teamA["R2 Score"]).toBe(100);
    expect(teamA.Average).toBe(100);

    const metrics = sheet("Metrics") as Array<Record<string, unknown>>;
    expect(metrics[0].TotalScore).toBe(100);
  });

  it("falls back to a 'Round <round_id>' label when the outcome's round_id doesn't match any known round", () => {
    const data: ClassExportData = {
      ...baseData,
      outcomes: [{ team_id: "team-1", round_id: "missing-round", total_score: 55 }],
    };
    generateClassExcel(data);
    const summary = sheet("Summary") as Array<Record<string, unknown>>;
    const teamA = summary.find((r) => r.Team === "Team A")!;
    expect(teamA["Round missing-round"]).toBe(55);
  });

  it("builds the Decisions sheet from the flat V1 columns only, one row per decision", () => {
    const data: ClassExportData = {
      ...baseData,
      decisions: [
        {
          team_id: "team-1",
          round_id: "round-1",
          is_submitted: true,
          recruitment_budget_per_hire: 4500,
          positions_to_fill: 5,
          training_budget_per_ee: 700,
          salary_vs_market_pct: 100,
        },
      ],
    };
    generateClassExcel(data);
    const decisions = sheet("Decisions") as Array<Record<string, unknown>>;
    expect(decisions).toEqual([
      {
        Team: "Team A",
        Round: 1,
        Submitted: true,
        RecruitmentBudget: 4500,
        Positions: 5,
        TrainingPerEE: 700,
        SalaryVsMarket: 100,
      },
    ]);
  });

  it("writes the workbook using the session name with spaces replaced by underscores", () => {
    generateClassExcel(baseData);
    expect(writeFile).toHaveBeenCalledWith(
      expect.anything(),
      "Fall_Cohort_class_export.xlsx"
    );
  });

  it("appends all four sheets in a fixed order: Summary, Metrics, Decisions, Reflections", () => {
    generateClassExcel(baseData);
    expect(appendedSheets.map((s) => s.name)).toEqual([
      "Summary",
      "Metrics",
      "Decisions",
      "Reflections",
    ]);
  });
});
