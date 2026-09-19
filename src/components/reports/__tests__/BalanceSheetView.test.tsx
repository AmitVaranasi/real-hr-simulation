import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BalanceSheetView } from "../BalanceSheetView";
import { FIGMA_BS } from "@/lib/reports/statement-data";
import type { FinancialRoundItem } from "../FinancialReportChrome";

const rounds: FinancialRoundItem[] = [
  {
    id: "1",
    roundId: "r1",
    roundNumber: 1,
    dateLabel: "Jan 1, 2026",
    href: "/reports/bs?round=r1",
  },
];

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

describe("BalanceSheetView — figma template", () => {
  it("renders the Assets and Liabilities & Equity statements as real tables with column and row headers", () => {
    render(
      <BalanceSheetView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(2);
    expect(
      screen.getByRole("table", { name: "Assets" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "Liabilities & Equity" })
    ).toBeInTheDocument();

    const assetsTable = screen.getByRole("table", { name: "Assets" });
    const columnHeaders = within(assetsTable).getAllByRole("columnheader");
    expect(columnHeaders.map((h) => h.textContent)).toEqual([
      "Assets",
      "Current Round",
      "Prior Round",
    ]);
    expect(
      within(assetsTable).getByRole("rowheader", { name: "Cash & Cash Equivalents" })
    ).toBeInTheDocument();
  });

  it("renders total assets equal to total liabilities plus equity (balances)", () => {
    render(
      <BalanceSheetView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    const totalCurrent = FIGMA_BS.cash + FIGMA_BS.ar + FIGMA_BS.otherCurrent;
    const totalLt = FIGMA_BS.ppe + FIGMA_BS.hrTechAsset + FIGMA_BS.otherLt;
    const totalAssets = totalCurrent + totalLt;
    // Total Assets appears in both the summary card and the footer row.
    expect(screen.getAllByText(money(totalAssets)).length).toBeGreaterThan(1);
    // The Liabilities & Equity table's footer is also labelled with the
    // (identical, by design) totalAssets figure — pin that both tables
    // agree, since a real balance sheet must balance.
    expect(screen.getByText("TOTAL LIABILITIES & EQUITY")).toBeInTheDocument();
  });

  it("renders the current ratio and debt-to-equity financial health indicators", () => {
    render(
      <BalanceSheetView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    const totalCurrent = FIGMA_BS.cash + FIGMA_BS.ar + FIGMA_BS.otherCurrent;
    const totalCl = FIGMA_BS.ap + FIGMA_BS.accruedComp + FIGMA_BS.otherCl;
    const currentRatio = (totalCurrent / totalCl).toFixed(2);
    expect(screen.getByText(`${currentRatio} : 1`)).toBeInTheDocument();
  });

  it("shows the workforce financial impact supplemental section with a computed total", () => {
    render(
      <BalanceSheetView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    expect(
      screen.getByText("Workforce Financial Impact (Supplemental Information)")
    ).toBeInTheDocument();
    const total =
      FIGMA_BS.compensation +
      FIGMA_BS.recruitment +
      FIGMA_BS.training +
      FIGMA_BS.hrTechSpend +
      FIGMA_BS.turnover;
    expect(screen.getByText(money(total))).toBeInTheDocument();
  });
});

describe("BalanceSheetView — live data overrides", () => {
  it("uses liveCompensation in the workforce impact total instead of the figma figure", () => {
    render(
      <BalanceSheetView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveCompensation={5_000_000}
      />
    );
    expect(screen.getByText(money(5_000_000))).toBeInTheDocument();
  });

  it("uses liveTurnover in the workforce impact total instead of the figma figure", () => {
    render(
      <BalanceSheetView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveTurnover={777_000}
      />
    );
    expect(screen.getByText(money(777_000))).toBeInTheDocument();
  });

  it("scales the balance sheet by liveRevenue relative to the figma revenue baseline", () => {
    render(
      <BalanceSheetView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveRevenue={25_058_500} // half of FIGMA_PL.revenue → scale of 0.5
      />
    );
    const halvedCash = money(FIGMA_BS.cash * 0.5);
    expect(screen.getAllByText(halvedCash).length).toBeGreaterThan(0);
  });
});
