import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CashFlowView } from "../CashFlowView";
import { FIGMA_CF } from "@/lib/reports/statement-data";
import type { FinancialRoundItem } from "../FinancialReportChrome";

const rounds: FinancialRoundItem[] = [
  {
    id: "1",
    roundId: "r1",
    roundNumber: 1,
    dateLabel: "Jan 1, 2026",
    href: "/reports/cf?round=r1",
  },
];

function parens(n: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
  return n < 0 ? `(${formatted})` : formatted;
}

// NOTE: a11y gap — the cash flow statement rows are CSS-grid <div>s, not a
// real <table>. Reported in the task summary, not fixed here.

describe("CashFlowView — figma template", () => {
  it("renders outflows in accounting parentheses format, not a leading minus sign", () => {
    render(
      <CashFlowView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    // Compensation paid is a negative figma figure; formatMoneyParens must
    // render it as "($X)" rather than "-$X".
    expect(screen.getByText(parens(FIGMA_CF.compPaid))).toBeInTheDocument();
    expect(screen.queryByText(`-${parens(FIGMA_CF.compPaid).slice(1, -1)}`)).not.toBeInTheDocument();
  });

  it("computes ending cash balance as beginning cash plus net change across all three activities", () => {
    render(
      <CashFlowView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    const netOperating =
      FIGMA_CF.cashFromOps +
      FIGMA_CF.compPaid +
      FIGMA_CF.recruitment +
      FIGMA_CF.training +
      FIGMA_CF.otherOp;
    const netInvesting = FIGMA_CF.hrTech + FIGMA_CF.otherInvest;
    const netFinancing = FIGMA_CF.debt;
    const endingCash =
      FIGMA_CF.beginCash + netOperating + netInvesting + netFinancing;
    expect(screen.getAllByText(parens(endingCash)).length).toBeGreaterThan(0);
    expect(screen.getByText("ENDING CASH BALANCE")).toBeInTheDocument();
  });

  it("suppresses the financing cash flow trend badge when prior financing was exactly zero", () => {
    render(
      <CashFlowView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    // FIGMA_CF.priorDebt is 0, so the Financing Cash Flow summary card change
    // is explicitly nulled out rather than computed (would otherwise divide
    // by zero / be misleadingly infinite).
    const label = screen.getByText("Financing Cash Flow");
    const card = label.closest("div")?.parentElement?.parentElement;
    expect(card).toBeTruthy();
    // The trend badge for this card falls back to the dash, not an arrow.
    expect(card!.textContent).toContain("—");
  });
});

describe("CashFlowView — live data overrides", () => {
  it("uses the absolute value of liveCompensation as a cash outflow", () => {
    render(
      <CashFlowView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveCompensation={2_000_000}
      />
    );
    expect(screen.getByText(parens(-2_000_000))).toBeInTheDocument();
  });

  it("scales the statement by liveRevenue relative to the figma baseline", () => {
    render(
      <CashFlowView
        roundNumber={1}
        asOfLabel="July 31, 2026"
        rounds={rounds}
        liveRevenue={25_058_500} // half of FIGMA_PL.revenue → scale of 0.5
      />
    );
    const halvedOps = parens(FIGMA_CF.cashFromOps * 0.5);
    expect(screen.getAllByText(halvedOps).length).toBeGreaterThan(0);
  });
});

describe("CashFlowView — workforce cash investments", () => {
  it("renders the supplemental workforce cash investment cards with percent-of-outflow", () => {
    render(
      <CashFlowView roundNumber={1} asOfLabel="July 31, 2026" rounds={rounds} />
    );
    expect(
      screen.getByText("Workforce Cash Investments (Supplemental Information)")
    ).toBeInTheDocument();
    expect(screen.getAllByText(/% of Cash Outflow/).length).toBeGreaterThan(0);
  });
});
