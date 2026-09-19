import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  FinancialReportChrome,
  SummaryMetricCard,
  TrendBadge,
  formatMoneySigned,
  formatMoneyParens,
  pctChange,
  type FinancialRoundItem,
} from "../FinancialReportChrome";
import { DollarSign } from "lucide-react";

function round(n: number, over: Partial<FinancialRoundItem> = {}): FinancialRoundItem {
  return {
    id: String(n),
    roundId: `r${n}`,
    roundNumber: n,
    dateLabel: `Jan ${n}, 2026`,
    href: `/reports?round=r${n}`,
    ...over,
  };
}

describe("FinancialReportChrome sidebar — placeholder vs real rounds", () => {
  it("renders five placeholder slots when no rounds have been computed", () => {
    render(
      <FinancialReportChrome
        reportLabel="Balance Sheet"
        rounds={[]}
        title="Balance Sheet – Round 1"
        subtitle="As of July 31, 2026"
        infoText="info"
      >
        <div>body</div>
      </FinancialReportChrome>
    );
    // Placeholders render as non-interactive containers, not links, so there
    // should be no navigable round links in the sidebar at all.
    expect(screen.queryAllByRole("link", { name: /Round \d/ })).toHaveLength(0);
    // 5 dash date labels, one per placeholder slot.
    expect(screen.getAllByText("—")).toHaveLength(5);
  });

  it("renders real rounds as links and pads the remainder with placeholders", () => {
    render(
      <FinancialReportChrome
        reportLabel="Balance Sheet"
        rounds={[round(1), round(2)]}
        title="Balance Sheet – Round 2"
        subtitle="As of July 31, 2026"
        infoText="info"
      >
        <div>body</div>
      </FinancialReportChrome>
    );
    // Rounds 1 and 2 are real → real, clickable links with their date labels.
    const link1 = screen.getByRole("link", { name: /Round 1/ });
    const link2 = screen.getByRole("link", { name: /Round 2/ });
    expect(link1).toHaveAttribute("href", "/reports?round=r1");
    expect(link2).toHaveAttribute("href", "/reports?round=r2");
    expect(within(link1).getByText("Jan 1, 2026")).toBeInTheDocument();

    // Rounds 3-5 are the placeholder boundary: not real, so not links, and
    // dated with the dash placeholder rather than a real date.
    expect(screen.queryByRole("link", { name: /Round 3/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("marks the selected round as active by selectedRoundId rather than by list position", () => {
    render(
      <FinancialReportChrome
        reportLabel="Balance Sheet"
        rounds={[round(1), round(2)]}
        selectedRoundId="r2"
        title="Balance Sheet – Round 2"
        subtitle="As of July 31, 2026"
        infoText="info"
      >
        <div>body</div>
      </FinancialReportChrome>
    );
    // Active round text is styled with the primary color class; pin that the
    // round matching selectedRoundId (not the first round) gets it.
    const link2 = screen.getByRole("link", { name: /Round 2/ });
    const link1 = screen.getByRole("link", { name: /Round 1/ });
    expect(within(link2).getByText("Round 2").className).toContain(
      "text-[var(--portal-primary)]"
    );
    expect(within(link1).getByText("Round 1").className).not.toContain(
      "text-[var(--portal-primary)]"
    );
  });

  it("defaults active state to the first round when selectedRoundId is not provided", () => {
    render(
      <FinancialReportChrome
        reportLabel="Balance Sheet"
        rounds={[round(1), round(2)]}
        title="Balance Sheet – Round 1"
        subtitle="As of July 31, 2026"
        infoText="info"
      >
        <div>body</div>
      </FinancialReportChrome>
    );
    const link1 = screen.getByRole("link", { name: /Round 1/ });
    expect(within(link1).getByText("Round 1").className).toContain(
      "text-[var(--portal-primary)]"
    );
  });

  it("pads past 5 when more than 5 real rounds exist, without dropping any", () => {
    const rounds = Array.from({ length: 7 }, (_, i) => round(i + 1));
    render(
      <FinancialReportChrome
        reportLabel="Balance Sheet"
        rounds={rounds}
        title="Balance Sheet – Round 7"
        subtitle="As of July 31, 2026"
        infoText="info"
      >
        <div>body</div>
      </FinancialReportChrome>
    );
    expect(screen.getByRole("link", { name: /Round 7/ })).toBeInTheDocument();
    // No dash placeholders left once every slot up to the max is real.
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });
});

describe("FinancialReportChrome chrome", () => {
  it("renders the title, subtitle, info text and children", () => {
    render(
      <FinancialReportChrome
        reportLabel="Balance Sheet"
        rounds={[round(1)]}
        title="Balance Sheet – Round 1"
        subtitle="As of July 31, 2026"
        infoText="Explanatory info text"
      >
        <div>Report body content</div>
      </FinancialReportChrome>
    );
    expect(
      screen.getByRole("heading", { name: "Balance Sheet – Round 1" })
    ).toBeInTheDocument();
    expect(screen.getByText("As of July 31, 2026")).toBeInTheDocument();
    expect(screen.getByText("Explanatory info text")).toBeInTheDocument();
    expect(screen.getByText("Report body content")).toBeInTheDocument();
  });

  it("calls onDownloadPdf when the download button is clicked", async () => {
    const onDownloadPdf = vi.fn();
    render(
      <FinancialReportChrome
        reportLabel="Balance Sheet"
        rounds={[round(1)]}
        title="t"
        subtitle="s"
        infoText="i"
        onDownloadPdf={onDownloadPdf}
      >
        <div />
      </FinancialReportChrome>
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Download PDF Report/i })
    );
    expect(onDownloadPdf).toHaveBeenCalledTimes(1);
  });

  it("does not throw when the download button is clicked without a handler", async () => {
    render(
      <FinancialReportChrome
        reportLabel="Balance Sheet"
        rounds={[round(1)]}
        title="t"
        subtitle="s"
        infoText="i"
      >
        <div />
      </FinancialReportChrome>
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Download PDF Report/i })
    );
  });

  it("provides a link back to the workforce brief", () => {
    render(
      <FinancialReportChrome
        reportLabel="Balance Sheet"
        rounds={[round(1)]}
        title="t"
        subtitle="s"
        infoText="i"
      >
        <div />
      </FinancialReportChrome>
    );
    expect(
      screen.getByRole("link", { name: /Back to The Workforce Brief/i })
    ).toHaveAttribute("href", "/reports/workforce-brief");
  });
});

describe("formatMoneySigned / formatMoneyParens", () => {
  it("formats positive values as plain currency", () => {
    expect(formatMoneySigned(1234)).toBe("$1,234");
  });
  it("formats negative values with a leading minus sign", () => {
    expect(formatMoneySigned(-1234)).toBe("-$1,234");
  });
  it("formats negative values in accounting parentheses", () => {
    expect(formatMoneyParens(-1234)).toBe("($1,234)");
  });
  it("formats positive values without parentheses", () => {
    expect(formatMoneyParens(1234)).toBe("$1,234");
  });
  it("rounds to whole dollars, no decimals", () => {
    expect(formatMoneySigned(1234.99)).toBe("$1,235");
  });
});

describe("pctChange", () => {
  it("computes percent change relative to prior", () => {
    expect(pctChange(110, 100)).toBeCloseTo(10, 5);
  });
  it("returns null when prior is zero to avoid a divide-by-zero result", () => {
    expect(pctChange(50, 0)).toBeNull();
  });
  it("uses the absolute value of prior in the denominator for negative priors", () => {
    expect(pctChange(-90, -100)).toBeCloseTo(10, 5);
  });
});

describe("TrendBadge", () => {
  it("renders a dash and no directional color when change is null", () => {
    render(<TrendBadge change={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
  it("shows an up arrow and the formatted percent for a positive change", () => {
    render(<TrendBadge change={12.34} />);
    expect(screen.getByText(/▲/)).toBeInTheDocument();
    expect(screen.getByText(/\+12\.3%/)).toBeInTheDocument();
  });
  it("shows a down arrow for a negative change", () => {
    render(<TrendBadge change={-5} />);
    expect(screen.getByText(/▼/)).toBeInTheDocument();
  });
  it("colors a positive change unfavorably (red) when invert is set", () => {
    render(<TrendBadge change={5} invert />);
    expect(screen.getByText(/▲/).className).toContain("text-red-600");
  });
  it("colors a positive change favorably (green) by default", () => {
    render(<TrendBadge change={5} />);
    expect(screen.getByText(/▲/).className).toContain("text-emerald-700");
  });
  it("renders percentage points suffix when unit is pp", () => {
    render(<TrendBadge change={1.2} unit="pp" />);
    expect(screen.getByText(/pp/)).toBeInTheDocument();
  });
});

describe("SummaryMetricCard", () => {
  it("renders the label, value and prior label as visible text", () => {
    render(
      <SummaryMetricCard
        label="Total Revenue"
        value="$50,117,000"
        priorLabel="Prior Round $48,750,000"
        change={2.8}
        icon={<DollarSign />}
        iconClass="bg-emerald-50"
      />
    );
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("$50,117,000")).toBeInTheDocument();
    expect(screen.getByText("Prior Round $48,750,000")).toBeInTheDocument();
  });
});
