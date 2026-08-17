"use client";

import {
  ArrowLeftRight,
  GraduationCap,
  Landmark,
  Monitor,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import {
  FinancialReportChrome,
  SummaryMetricCard,
  TrendBadge,
  formatMoneyParens,
  formatMoneySigned,
  pctChange,
  type FinancialRoundItem,
} from "@/components/reports/FinancialReportChrome";
import { FIGMA_CF, scaleByRevenue } from "@/lib/reports/statement-data";

type Props = {
  roundNumber: number;
  asOfLabel: string;
  rounds: FinancialRoundItem[];
  selectedRoundId?: string | null;
  liveRevenue?: number | null;
  liveCompensation?: number | null;
};

export function CashFlowView({
  roundNumber,
  asOfLabel,
  rounds,
  selectedRoundId,
  liveRevenue,
  liveCompensation,
}: Props) {
  const s = scaleByRevenue(liveRevenue);
  const cashFromOps = FIGMA_CF.cashFromOps * s;
  const priorCashFromOps = FIGMA_CF.priorCashFromOps * s;
  const compPaid = liveCompensation
    ? -Math.abs(liveCompensation)
    : FIGMA_CF.compPaid * s;
  const priorCompPaid = FIGMA_CF.priorCompPaid * s;
  const recruitment = FIGMA_CF.recruitment * s;
  const priorRecruitment = FIGMA_CF.priorRecruitment * s;
  const training = FIGMA_CF.training * s;
  const priorTraining = FIGMA_CF.priorTraining * s;
  const otherOp = FIGMA_CF.otherOp * s;
  const priorOtherOp = FIGMA_CF.priorOtherOp * s;
  const hrTech = FIGMA_CF.hrTech * s;
  const priorHrTech = FIGMA_CF.priorHrTech * s;
  const otherInvest = FIGMA_CF.otherInvest * s;
  const priorOtherInvest = FIGMA_CF.priorOtherInvest * s;
  const debt = FIGMA_CF.debt * s;
  const priorDebt = FIGMA_CF.priorDebt * s;
  const beginCash = FIGMA_CF.beginCash * s;
  const priorBeginCash = FIGMA_CF.priorBeginCash * s;

  const netOperating =
    cashFromOps + compPaid + recruitment + training + otherOp;
  const priorNetOperating =
    priorCashFromOps +
    priorCompPaid +
    priorRecruitment +
    priorTraining +
    priorOtherOp;
  const netInvesting = hrTech + otherInvest;
  const priorNetInvesting = priorHrTech + priorOtherInvest;
  const netFinancing = debt;
  const priorNetFinancing = priorDebt;
  const netChange = netOperating + netInvesting + netFinancing;
  const priorNetChange =
    priorNetOperating + priorNetInvesting + priorNetFinancing;
  const endingCash = beginCash + netChange;
  const priorEndingCash = FIGMA_CF.priorEndingCash * s;

  const outflowAbs =
    Math.abs(compPaid) +
    Math.abs(recruitment) +
    Math.abs(training) +
    Math.abs(hrTech) +
    Math.abs(otherOp) +
    Math.abs(otherInvest) +
    Math.abs(debt);

  type Row =
    | { kind: "section"; label: string; color: string }
    | {
        kind: "line";
        label: string;
        current: number;
        prior: number;
        total?: boolean;
        tone?: "op" | "inv" | "fin" | "net" | "begin" | "end";
      };

  const rows: Row[] = [
    {
      kind: "section",
      label: "Cash from Operating Activities",
      color: "text-emerald-700",
    },
    {
      kind: "line",
      label: "Cash Received from Operations",
      current: cashFromOps,
      prior: priorCashFromOps,
    },
    {
      kind: "line",
      label: "Compensation & Benefits Paid",
      current: compPaid,
      prior: priorCompPaid,
    },
    {
      kind: "line",
      label: "Recruitment & Onboarding",
      current: recruitment,
      prior: priorRecruitment,
    },
    {
      kind: "line",
      label: "Training & Development",
      current: training,
      prior: priorTraining,
    },
    {
      kind: "line",
      label: "Other Operating Costs",
      current: otherOp,
      prior: priorOtherOp,
    },
    {
      kind: "line",
      label: "Net Cash from Operating Activities",
      current: netOperating,
      prior: priorNetOperating,
      total: true,
      tone: "op",
    },
    {
      kind: "section",
      label: "Cash from Investing Activities",
      color: "text-[var(--portal-primary)]",
    },
    {
      kind: "line",
      label: "HR Technology & Systems",
      current: hrTech,
      prior: priorHrTech,
    },
    {
      kind: "line",
      label: "Other Organizational Investments",
      current: otherInvest,
      prior: priorOtherInvest,
    },
    {
      kind: "line",
      label: "Net Cash from Investing Activities",
      current: netInvesting,
      prior: priorNetInvesting,
      total: true,
      tone: "inv",
    },
    {
      kind: "section",
      label: "Cash from Financing Activities",
      color: "text-[var(--portal-purple)]",
    },
    {
      kind: "line",
      label: "Debt Borrowed / (Repaid)",
      current: debt,
      prior: priorDebt,
    },
    {
      kind: "line",
      label: "Net Cash from Financing Activities",
      current: netFinancing,
      prior: priorNetFinancing,
      total: true,
      tone: "fin",
    },
    {
      kind: "line",
      label: "NET CHANGE IN CASH",
      current: netChange,
      prior: priorNetChange,
      total: true,
      tone: "net",
    },
    {
      kind: "line",
      label: "Beginning Cash Balance",
      current: beginCash,
      prior: priorBeginCash,
      tone: "begin",
    },
    {
      kind: "line",
      label: "ENDING CASH BALANCE",
      current: endingCash,
      prior: priorEndingCash,
      total: true,
      tone: "end",
    },
  ];

  function rowBg(
    tone?: "op" | "inv" | "fin" | "net" | "begin" | "end"
  ) {
    if (tone === "op") return "bg-emerald-50 font-bold text-emerald-800";
    if (tone === "inv") return "bg-sky-50 font-bold text-[var(--portal-primary)]";
    if (tone === "fin") return "bg-violet-50 font-bold text-[var(--portal-purple)]";
    if (tone === "net") return "bg-red-50 font-bold text-red-700";
    if (tone === "begin") return "bg-emerald-50/60 font-semibold";
    if (tone === "end") return "bg-[var(--portal-brand-soft)] font-bold text-[var(--portal-brand)]";
    return "";
  }

  return (
    <FinancialReportChrome
      reportLabel="Cash Flow Statement"
      rounds={rounds}
      selectedRoundId={selectedRoundId}
      title={`Cash Flow Statement – Round ${roundNumber}`}
      subtitle={`For the Period Ending ${asOfLabel}`}
      infoText="The Cash Flow Statement shows how cash moved in and out of the organization during this round. Use this report to understand the cash impact of your workforce investments and business decisions."
    >
      <div className="grid gap-3 lg:grid-cols-4">
        <SummaryMetricCard
          label="Operating Cash Flow"
          value={formatMoneySigned(netOperating)}
          priorLabel={`Prior Round ${formatMoneySigned(priorNetOperating)}`}
          change={pctChange(netOperating, priorNetOperating)}
          icon={<ArrowLeftRight className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-700"
        />
        <SummaryMetricCard
          label="Investing Cash Flow"
          value={formatMoneySigned(netInvesting)}
          priorLabel={`Prior Round ${formatMoneySigned(priorNetInvesting)}`}
          change={pctChange(netInvesting, priorNetInvesting)}
          icon={<Landmark className="h-5 w-5" />}
          iconClass="bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
          valueClass={netInvesting < 0 ? "text-red-600" : undefined}
        />
        <SummaryMetricCard
          label="Financing Cash Flow"
          value={formatMoneySigned(netFinancing)}
          priorLabel={`Prior Round ${formatMoneySigned(priorNetFinancing)}`}
          change={priorDebt === 0 ? null : pctChange(netFinancing, priorNetFinancing)}
          icon={<Landmark className="h-5 w-5" />}
          iconClass="bg-violet-50 text-[var(--portal-purple)]"
          valueClass={netFinancing < 0 ? "text-red-600" : undefined}
        />
        <SummaryMetricCard
          label="Ending Cash Balance"
          value={formatMoneySigned(endingCash)}
          priorLabel={`Prior Round ${formatMoneySigned(priorEndingCash)}`}
          change={pctChange(endingCash, priorEndingCash)}
          icon={<Wallet className="h-5 w-5" />}
          iconClass="bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr_0.8fr] gap-2 bg-[var(--portal-navy)] px-4 py-2.5 text-[0.6875rem] font-bold uppercase tracking-wide text-white">
          <span>Cash Flow</span>
          <span className="text-right">Current Round</span>
          <span className="text-right">Prior Round</span>
          <span className="text-right">Change</span>
          <span className="text-right">Change %</span>
        </div>
        {rows.map((row, i) => {
          if (row.kind === "section") {
            return (
              <div
                key={`${row.label}-${i}`}
                className={`bg-[#f8fafc] px-4 py-2 text-xs font-bold uppercase tracking-wide ${row.color}`}
              >
                {row.label}
              </div>
            );
          }
          const ch = row.current - row.prior;
          const pct =
            row.prior === 0 && row.current !== 0
              ? null
              : pctChange(row.current, row.prior);
          return (
            <div
              key={`${row.label}-${i}`}
              className={`grid grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr_0.8fr] gap-2 border-b border-[var(--portal-sidebar-border)] px-4 py-2 text-xs ${rowBg(row.tone)}`}
            >
              <span>{row.label}</span>
              <span className="text-right tabular-nums">
                {formatMoneyParens(row.current)}
              </span>
              <span className="text-right tabular-nums text-[var(--portal-muted)]">
                {formatMoneyParens(row.prior)}
              </span>
              <span className="text-right tabular-nums">
                {formatMoneyParens(ch)}
              </span>
              <span className="text-right">
                <TrendBadge change={pct} />
              </span>
            </div>
          );
        })}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--portal-primary)]">
          Workforce Cash Investments (Supplemental Information)
        </h2>
        <div className="grid gap-3 lg:grid-cols-4">
          {[
            {
              label: "Compensation & Benefits",
              value: Math.abs(compPaid),
              icon: Users,
              color: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Recruitment & Onboarding",
              value: Math.abs(recruitment),
              icon: Search,
              color: "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]",
            },
            {
              label: "Training & Development",
              value: Math.abs(training),
              icon: GraduationCap,
              color: "bg-violet-50 text-[var(--portal-purple)]",
            },
            {
              label: "HR Technology & Systems",
              value: Math.abs(hrTech),
              icon: Monitor,
              color: "bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]",
            },
          ].map((card) => {
            const Icon = card.icon;
            const pct =
              outflowAbs > 0 ? (card.value / outflowAbs) * 100 : 0;
            return (
              <div
                key={card.label}
                className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                      {card.label}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[var(--portal-title)]">
                      {formatMoneySigned(card.value)}
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-[var(--portal-muted)]">
                      {pct.toFixed(1)}% of Cash Outflow
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </FinancialReportChrome>
  );
}
