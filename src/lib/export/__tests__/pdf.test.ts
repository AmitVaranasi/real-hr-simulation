import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PdfReportData } from "@/lib/export/pdf";

const autoTableCalls: Array<{ head?: unknown; body?: unknown }> = [];
const saveFn = vi.fn();
const textFn = vi.fn();

vi.mock("jspdf", () => ({
  default: class FakeJsPDF {
    lastAutoTable = { finalY: 50 };
    setFontSize = vi.fn();
    text = textFn;
    splitTextToSize = vi.fn((text: string) => [text]);
    addPage = vi.fn();
    save = saveFn;
  },
}));

vi.mock("jspdf-autotable", () => ({
  default: vi.fn((_doc: unknown, opts: { head?: unknown; body?: unknown }) => {
    autoTableCalls.push(opts);
  }),
}));

const { generateTeamPdf, outcomeToPdfData } = await import("@/lib/export/pdf");

describe("generateTeamPdf", () => {
  beforeEach(() => {
    autoTableCalls.length = 0;
    saveFn.mockClear();
    textFn.mockClear();
  });

  const baseData: PdfReportData = {
    sessionName: "Fall Cohort",
    teamName: "Team Alpha",
    industry: "Manufacturing",
    strategy: "Focus",
    roundNumber: 2,
    bsc: { financial: 70.4, employee: 60.6, process: 65.1, learning: 55.9, total: 63 },
    metrics: [{ name: "Cost per hire", value: "$1,200" }],
    financials: [{ label: "Revenue", value: "$1,000,000" }],
  };

  it("renders the BSC table with one decimal place per score, including the pre-computed total", () => {
    generateTeamPdf(baseData);
    const bscTable = autoTableCalls[0];
    expect(bscTable.head).toEqual([["Perspective", "Score"]]);
    expect(bscTable.body).toEqual([
      ["Financial", "70.4"],
      ["Employee", "60.6"],
      ["Internal Process", "65.1"],
      ["Learning & Growth", "55.9"],
      ["Total", "63.0"],
    ]);
  });

  it("passes the metrics and financials rows through verbatim, in caller-supplied order", () => {
    const data: PdfReportData = {
      ...baseData,
      metrics: [
        { name: "Cost per hire", value: "$1,200" },
        { name: "Turnover", value: "12.0%" },
      ],
      financials: [
        { label: "Revenue", value: "$1,000,000" },
        { label: "Profit", value: "$50,000" },
      ],
    };
    generateTeamPdf(data);
    const metricsTable = autoTableCalls[1];
    const financialsTable = autoTableCalls[2];
    expect(metricsTable.body).toEqual([
      ["Cost per hire", "$1,200"],
      ["Turnover", "12.0%"],
    ]);
    expect(financialsTable.body).toEqual([
      ["Revenue", "$1,000,000"],
      ["Profit", "$50,000"],
    ]);
  });

  it("saves the file named after the team and round number, with spaces underscored", () => {
    generateTeamPdf({ ...baseData, teamName: "Team Alpha Beta" });
    expect(saveFn).toHaveBeenCalledWith("Team_Alpha_Beta_Round2.pdf");
  });

  it("omits the Round Summary section entirely when feedback.round_summary is absent", () => {
    generateTeamPdf(baseData);
    const calls = textFn.mock.calls.map((c) => c[0]);
    expect(calls).not.toContain("Round Summary");
  });

  it("renders the Round Summary heading when feedback.round_summary is present", () => {
    generateTeamPdf({
      ...baseData,
      feedback: { round_summary: "Great quarter." } as PdfReportData["feedback"],
    });
    const calls = textFn.mock.calls.map((c) => c[0]);
    expect(calls).toContain("Round Summary");
  });
});

describe("outcomeToPdfData", () => {
  const team = { name: "Team Alpha", industry: "Manufacturing", strategy: "Focus" };

  it("prefers instructor_override over total_score for the BSC total, same as the Excel export", () => {
    const outcome = {
      score_financial: 70,
      score_employee: 60,
      score_process: 65,
      score_learning: 55,
      total_score: 60,
      instructor_override: 88,
      cost_per_hire: 1200,
      time_to_fill: 30,
      turnover_rate: 0.12,
      employee_satisfaction: 80,
      engagement_level: 75,
      training_roi: 0.2,
      dei_score: 65,
      budget_adherence: 0.9,
      revenue: 1_000_000,
      profit: 50_000,
      stock_price: 42.5,
      market_share: 0.15,
      headcount: 120,
    };
    const data = outcomeToPdfData("Fall Cohort", team, 3, outcome);
    expect(data.bsc.total).toBe(88);
  });

  it("defaults productivity, hiring_quality and turnover_cost to 0 when the outcome row predates those columns", () => {
    const outcome = {
      score_financial: 70,
      score_employee: 60,
      score_process: 65,
      score_learning: 55,
      total_score: 60,
      cost_per_hire: 1200,
      time_to_fill: 30,
      turnover_rate: 0.12,
      employee_satisfaction: 80,
      engagement_level: 75,
      training_roi: 0.2,
      dei_score: 65,
      budget_adherence: 0.9,
      revenue: 1_000_000,
      profit: 50_000,
      stock_price: 42.5,
      market_share: 0.15,
      headcount: 120,
    };
    const data = outcomeToPdfData("Fall Cohort", team, 3, outcome);
    const productivity = data.metrics.find((m) => m.name === "Productivity");
    const hiringQuality = data.metrics.find((m) => m.name === "Hiring quality");
    const turnoverCost = data.metrics.find((m) => m.name === "Turnover cost");
    expect(productivity?.value).toBe("0.0%");
    expect(hiringQuality?.value).toBe("0/100");
    expect(turnoverCost?.value).toBe("$0");
  });

  it("formats currency, percent and fixed-point metric values using the shared formatters", () => {
    const outcome = {
      score_financial: 70,
      score_employee: 60,
      score_process: 65,
      score_learning: 55,
      total_score: 60,
      cost_per_hire: 1234,
      time_to_fill: 30.6,
      turnover_rate: 12.345,
      employee_satisfaction: 80.4,
      engagement_level: 75.6,
      training_roi: 20.5,
      dei_score: 65.2,
      budget_adherence: 90.1,
      revenue: 1_000_000,
      profit: 50_000,
      stock_price: 42.567,
      market_share: 15.25,
      headcount: 120,
    };
    const data = outcomeToPdfData("Fall Cohort", team, 3, outcome);
    expect(data.metrics.find((m) => m.name === "Cost per hire")?.value).toBe("$1,234");
    expect(data.metrics.find((m) => m.name === "Turnover")?.value).toBe("12.3%");
    expect(data.financials.find((f) => f.label === "Stock price")?.value).toBe("$42.57");
  });
});
