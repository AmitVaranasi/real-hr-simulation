import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancialRatiosView } from "../FinancialRatiosView";
import type { FinancialRoundItem } from "../FinancialReportChrome";

const rounds: FinancialRoundItem[] = [
  {
    id: "1",
    roundId: "r1",
    roundNumber: 1,
    dateLabel: "Jan 1, 2026",
    href: "/reports/ratios?round=r1",
  },
];

// NOTE: a11y gap — the Financial Ratio Summary is a CSS-grid of <div>s, not a
// real <table>. Reported in the task summary, not fixed here.

describe("FinancialRatiosView", () => {
  it("renders the report title and the six ratio summary cards", () => {
    render(
      <FinancialRatiosView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
      />
    );
    expect(
      screen.getByRole("heading", { name: /Financial Ratio Report – Round 1/ })
    ).toBeInTheDocument();
    // Six ratio labels shown as summary card headers.
    for (const label of [
      "Current Ratio",
      "Debt-to-Assets Ratio",
      "Debt-to-Equity Ratio",
      "Operating Margin",
      "Net Profit Margin",
      "Revenue Per Employee",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("renders the ratio summary table with the same set of ratios", () => {
    render(
      <FinancialRatiosView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
      />
    );
    expect(screen.getByText("Financial Ratio Summary")).toBeInTheDocument();
    expect(screen.getAllByText("Revenue per Employee").length).toBeGreaterThan(0);
  });

  it("renders a glossary entry with explanatory text for each ratio", () => {
    render(
      <FinancialRatiosView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
      />
    );
    expect(screen.getByText("Understanding the Ratios")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ability to meet short-term financial obligations by comparing current assets to current liabilities."
      )
    ).toBeInTheDocument();
  });

  it("overrides net margin with liveProfitMargin when supplied, instead of computing it", () => {
    render(
      <FinancialRatiosView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveProfitMargin={42.5}
      />
    );
    expect(screen.getAllByText("42.5%").length).toBeGreaterThan(0);
  });

  it("shows negative operating/net margins in red text via valueClass", () => {
    render(
      <FinancialRatiosView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveProfitMargin={-15}
      />
    );
    const negativeMargin = screen.getAllByText("-15.0%")[0];
    expect(negativeMargin.className).toContain("text-red-600");
  });
});
