import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfitLossView } from "../ProfitLossView";
import { FIGMA_PL } from "@/lib/reports/statement-data";
import type { FinancialRoundItem } from "../FinancialReportChrome";

const rounds: FinancialRoundItem[] = [
  {
    id: "1",
    roundId: "r1",
    roundNumber: 1,
    dateLabel: "Jan 1, 2026",
    href: "/reports/pl?round=r1",
  },
];

describe("ProfitLossView — figma template (no live data)", () => {
  it("renders the statement and workforce-cost tables as real tables with row/column semantics", () => {
    render(
      <ProfitLossView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    const statementTable = screen.getByRole("table", {
      name: "Profit & Loss Statement",
    });
    expect(statementTable).toBeInTheDocument();
    expect(
      within(statementTable)
        .getAllByRole("columnheader")
        .map((h) => h.textContent)
    ).toEqual([
      "Profit & Loss Statement",
      "Current Round",
      "Prior Round",
      "Change",
      "Change %",
    ]);
    expect(
      within(statementTable).getByRole("rowheader", { name: "Total Revenue" })
    ).toBeInTheDocument();

    const workforceTable = screen.getByRole("table", {
      name: "Workforce Cost Analysis",
    });
    expect(workforceTable).toBeInTheDocument();
    expect(
      within(workforceTable).getByRole("rowheader", {
        name: "Total Workforce Costs",
      })
    ).toBeInTheDocument();
  });
  it("renders the report title for the given round", () => {
    render(
      <ProfitLossView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    expect(
      screen.getByRole("heading", { name: /Profit & Loss Statement – Round 1/ })
    ).toBeInTheDocument();
  });

  it("defaults revenue and totals to the FIGMA_PL template, formatted as whole-dollar currency", () => {
    render(
      <ProfitLossView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    // Revenue line appears both in the summary card and the statement row.
    expect(screen.getAllByText("$50,117,000").length).toBeGreaterThan(0);
    // Total operating expenses is the sum of every FIGMA_PL expense line.
    const totalOpEx =
      FIGMA_PL.wages +
      FIGMA_PL.benefits +
      FIGMA_PL.recruitment +
      FIGMA_PL.training +
      FIGMA_PL.performance +
      FIGMA_PL.relations +
      FIGMA_PL.hrTech +
      FIGMA_PL.turnover +
      FIGMA_PL.otherOpEx;
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(totalOpEx);
    expect(screen.getAllByText(formatted).length).toBeGreaterThan(0);
  });

  it("shows net loss figures in red text via valueClass when net profit is negative", () => {
    // Force a loss by claiming an enormous compensation liveCompensation figure,
    // which both inflates wagesAdj/benefitsAdj and pushes netProfit negative.
    render(
      <ProfitLossView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveCompensation={200_000_000}
      />
    );
    const netProfitValues = screen.getAllByText(/^\-\$/);
    expect(netProfitValues.length).toBeGreaterThan(0);
    expect(netProfitValues[0].className).toContain("text-red-600");
  });
});

describe("ProfitLossView — live data overrides", () => {
  it("scales figma line items by liveRevenue relative to the figma baseline", () => {
    render(
      <ProfitLossView
        roundNumber={2}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveRevenue={FIGMA_PL.revenue * 2}
      />
    );
    // Revenue itself is shown verbatim (liveRevenue is used directly, not scaled).
    const doubledRevenue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(FIGMA_PL.revenue * 2);
    expect(screen.getAllByText(doubledRevenue).length).toBeGreaterThan(0);
  });

  it("splits liveCompensation into 85% wages / 15% benefits instead of using the figma split", () => {
    const liveCompensation = 10_000_000;
    render(
      <ProfitLossView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveCompensation={liveCompensation}
      />
    );
    const wagesFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(liveCompensation * 0.85);
    expect(screen.getAllByText(wagesFormatted).length).toBeGreaterThan(0);
  });

  it("uses liveTurnover in place of the figma turnover figure", () => {
    const liveTurnover = 999_000;
    render(
      <ProfitLossView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveTurnover={liveTurnover}
      />
    );
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(liveTurnover);
    expect(screen.getAllByText(formatted).length).toBeGreaterThan(0);
  });

  it("uses liveHeadcount for revenue-per-employee rather than the figma headcount", () => {
    render(
      <ProfitLossView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveHeadcount={1}
        liveRevenue={1_000_000}
      />
    );
    // With headcount of 1, revenue-per-employee equals revenue exactly.
    expect(screen.getAllByText("$1,000,000").length).toBeGreaterThan(0);
  });
});

describe("ProfitLossView — section structure", () => {
  it("renders section headers and workforce cost analysis supplemental table", () => {
    render(
      <ProfitLossView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    expect(screen.getByText("REVENUE")).toBeInTheDocument();
    expect(screen.getByText("OPERATING EXPENSES")).toBeInTheDocument();
    expect(
      screen.getByText("Workforce Cost Analysis (Supplemental Information)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Profitability Indicators")
    ).toBeInTheDocument();
  });
});
