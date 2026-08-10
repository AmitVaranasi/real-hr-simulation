"use client";

import { DollarSign, Percent, TrendingUp, Users, Wallet } from "lucide-react";
import {
  FinancialReportChrome,
  SummaryMetricCard,
  TrendBadge,
  formatMoneySigned,
  pctChange,
  type FinancialRoundItem,
} from "@/components/reports/FinancialReportChrome";
import { FIGMA_PL, scaleByRevenue } from "@/lib/reports/statement-data";

type Props = {
  roundNumber: number;
  asOfLabel: string;
  rounds: FinancialRoundItem[];
  selectedRoundId?: string | null;
  liveRevenue?: number | null;
  liveProfit?: number | null;
  liveCompensation?: number | null;
  liveTurnover?: number | null;
  liveHeadcount?: number | null;
};

function changeAmt(current: number, prior: number) {
  return current - prior;
}

export function ProfitLossView({
  roundNumber,
  asOfLabel,
  rounds,
  selectedRoundId,
  liveRevenue,
  liveProfit,
  liveCompensation,
  liveTurnover,
  liveHeadcount,
}: Props) {
  const s = scaleByRevenue(liveRevenue);
  const revenue = liveRevenue ?? FIGMA_PL.revenue * s;
  const priorRevenue = FIGMA_PL.priorRevenue * s;

  const wages = FIGMA_PL.wages * s;
  const priorWages = FIGMA_PL.priorWages * s;
  const benefits = FIGMA_PL.benefits * s;
  const priorBenefits = FIGMA_PL.priorBenefits * s;
  const wagesAdj = liveCompensation != null ? liveCompensation * 0.85 : wages;
  const benefitsAdj =
    liveCompensation != null ? liveCompensation * 0.15 : benefits;

  const recruitment = FIGMA_PL.recruitment * s;
  const priorRecruitment = FIGMA_PL.priorRecruitment * s;
  const training = FIGMA_PL.training * s;
  const priorTraining = FIGMA_PL.priorTraining * s;
  const performance = FIGMA_PL.performance * s;
  const priorPerformance = FIGMA_PL.priorPerformance * s;
  const relations = FIGMA_PL.relations * s;
  const priorRelations = FIGMA_PL.priorRelations * s;
  const hrTech = FIGMA_PL.hrTech * s;
  const priorHrTech = FIGMA_PL.priorHrTech * s;
  const turnover = liveTurnover ?? FIGMA_PL.turnover * s;
  const priorTurnover = FIGMA_PL.priorTurnover * s;
  const otherOpEx = FIGMA_PL.otherOpEx * s;
  const priorOtherOpEx = FIGMA_PL.priorOtherOpEx * s;
  const interest = FIGMA_PL.interest * s;
  const priorInterest = FIGMA_PL.priorInterest * s;

  const totalOpEx =
    wagesAdj +
    benefitsAdj +
    recruitment +
    training +
    performance +
    relations +
    hrTech +
    turnover +
    otherOpEx;
  const priorTotalOpEx =
    priorWages +
    priorBenefits +
    priorRecruitment +
    priorTraining +
    priorPerformance +
    priorRelations +
    priorHrTech +
    priorTurnover +
    priorOtherOpEx;

  const operatingIncome = revenue - totalOpEx;
  const priorOperating = priorRevenue - priorTotalOpEx;
  const netProfit = liveProfit ?? operatingIncome - interest;
  const priorNet = priorOperating - priorInterest;

  const headcount = liveHeadcount ?? FIGMA_PL.headcount;
  const priorHeadcount = FIGMA_PL.priorHeadcount;
  const revPerEe = headcount > 0 ? revenue / headcount : 0;
  const priorRevPerEe = priorHeadcount > 0 ? priorRevenue / priorHeadcount : 0;

  const workforceCosts =
    wagesAdj +
    benefitsAdj +
    recruitment +
    training +
    performance +
    relations +
    hrTech +
    turnover;
  const priorWorkforce =
    priorWages +
    priorBenefits +
    priorRecruitment +
    priorTraining +
    priorPerformance +
    priorRelations +
    priorHrTech +
    priorTurnover;

  const opMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;
  const priorOpMargin =
    priorRevenue > 0 ? (priorOperating / priorRevenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const priorNetMargin = priorRevenue > 0 ? (priorNet / priorRevenue) * 100 : 0;
  const wfPct = revenue > 0 ? (workforceCosts / revenue) * 100 : 0;
  const priorWfPct =
    priorRevenue > 0 ? (priorWorkforce / priorRevenue) * 100 : 0;

  const plRows: Array<{
    label: string;
    current: number;
    prior: number;
    section?: boolean;
    total?: boolean;
    highlight?: boolean;
  }> = [
    { label: "REVENUE", current: 0, prior: 0, section: true },
    {
      label: "Sales / Operating Revenue",
      current: revenue,
      prior: priorRevenue,
    },
    {
      label: "Total Revenue",
      current: revenue,
      prior: priorRevenue,
      total: true,
    },
    { label: "OPERATING EXPENSES", current: 0, prior: 0, section: true },
    {
      label: "Compensation & Wages",
      current: wagesAdj,
      prior: priorWages,
    },
    { label: "Benefits", current: benefitsAdj, prior: priorBenefits },
    {
      label: "Recruitment & Onboarding",
      current: recruitment,
      prior: priorRecruitment,
    },
    {
      label: "Training & Development",
      current: training,
      prior: priorTraining,
    },
    {
      label: "Performance Management",
      current: performance,
      prior: priorPerformance,
    },
    {
      label: "Employee Relations",
      current: relations,
      prior: priorRelations,
    },
    { label: "HR Technology", current: hrTech, prior: priorHrTech },
    { label: "Turnover Costs", current: turnover, prior: priorTurnover },
    {
      label: "Other Operating Expenses",
      current: otherOpEx,
      prior: priorOtherOpEx,
    },
    {
      label: "Total Operating Expenses",
      current: totalOpEx,
      prior: priorTotalOpEx,
      total: true,
    },
    {
      label: "Operating Income (Loss)",
      current: operatingIncome,
      prior: priorOperating,
      highlight: true,
    },
    {
      label: "Interest & Other Expense",
      current: interest,
      prior: priorInterest,
    },
    {
      label: "Net Profit (Loss)",
      current: netProfit,
      prior: priorNet,
      highlight: true,
    },
  ];

  const workforceRows = [
    {
      label: "Compensation & Benefits",
      amount: wagesAdj + benefitsAdj,
      prior: priorWages + priorBenefits,
      color: "bg-[var(--portal-primary)]",
    },
    {
      label: "Recruitment & Onboarding",
      amount: recruitment,
      prior: priorRecruitment,
      color: "bg-emerald-500",
    },
    {
      label: "Training & Development",
      amount: training,
      prior: priorTraining,
      color: "bg-[var(--portal-purple)]",
    },
    {
      label: "Performance Management",
      amount: performance,
      prior: priorPerformance,
      color: "bg-teal-500",
    },
    {
      label: "Employee Relations",
      amount: relations,
      prior: priorRelations,
      color: "bg-[var(--portal-brand)]",
    },
    {
      label: "HR Technology",
      amount: hrTech,
      prior: priorHrTech,
      color: "bg-sky-600",
    },
    {
      label: "Turnover Cost",
      amount: turnover,
      prior: priorTurnover,
      color: "bg-red-500",
    },
  ];

  return (
    <FinancialReportChrome
      reportLabel="Profit & Loss Statement"
      rounds={rounds}
      selectedRoundId={selectedRoundId}
      title={`Profit & Loss Statement – Round ${roundNumber}`}
      subtitle={`For the Period Ending ${asOfLabel}`}
      infoText="The Profit & Loss Statement summarizes the organization’s financial performance during this round. Use this report to understand how HR investments and decisions are impacting profitability."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          label="Total Revenue"
          value={formatMoneySigned(revenue)}
          priorLabel={`Prior Round ${formatMoneySigned(priorRevenue)}`}
          change={pctChange(revenue, priorRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          iconClass="bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
        />
        <SummaryMetricCard
          label="Total Operating Expenses"
          value={formatMoneySigned(totalOpEx)}
          priorLabel={`Prior Round ${formatMoneySigned(priorTotalOpEx)}`}
          change={pctChange(totalOpEx, priorTotalOpEx)}
          invertTrend
          icon={<Wallet className="h-5 w-5" />}
          iconClass="bg-red-50 text-red-600"
        />
        <SummaryMetricCard
          label="Operating Income (Loss)"
          value={formatMoneySigned(operatingIncome)}
          priorLabel={`Prior Round ${formatMoneySigned(priorOperating)}`}
          change={pctChange(operatingIncome, priorOperating)}
          icon={<Percent className="h-5 w-5" />}
          iconClass="bg-violet-50 text-[var(--portal-purple)]"
          valueClass={operatingIncome < 0 ? "text-red-600" : undefined}
        />
        <SummaryMetricCard
          label="Net Profit (Loss)"
          value={formatMoneySigned(netProfit)}
          priorLabel={`Prior Round ${formatMoneySigned(priorNet)}`}
          change={pctChange(netProfit, priorNet)}
          icon={<DollarSign className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-700"
          valueClass={netProfit < 0 ? "text-red-600" : undefined}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr_0.8fr] gap-2 bg-[var(--portal-navy)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white">
          <span>Profit &amp; Loss Statement</span>
          <span className="text-right">Current Round</span>
          <span className="text-right">Prior Round</span>
          <span className="text-right">Change</span>
          <span className="text-right">Change %</span>
        </div>
        <div>
          {plRows.map((row) => {
            if (row.section) {
              return (
                <div
                  key={row.label}
                  className="bg-[#f8fafc] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--portal-primary)]"
                >
                  {row.label}
                </div>
              );
            }
            const ch = changeAmt(row.current, row.prior);
            const pct = pctChange(row.current, row.prior);
            return (
              <div
                key={row.label}
                className={`grid grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr_0.8fr] gap-2 border-b border-[var(--portal-sidebar-border)] px-4 py-2 text-xs ${
                  row.highlight
                    ? "bg-red-50 font-bold"
                    : row.total
                      ? "bg-[#f1f5f9] font-bold"
                      : ""
                }`}
              >
                <span>{row.label}</span>
                <span
                  className={`text-right tabular-nums ${
                    row.current < 0 ? "text-red-600" : ""
                  }`}
                >
                  {formatMoneySigned(row.current)}
                </span>
                <span className="text-right tabular-nums text-[var(--portal-muted)]">
                  {formatMoneySigned(row.prior)}
                </span>
                <span
                  className={`text-right tabular-nums ${
                    ch < 0 ? "text-red-600" : ""
                  }`}
                >
                  {formatMoneySigned(ch)}
                </span>
                <span className="text-right">
                  <TrendBadge change={pct} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--portal-primary)]">
          Workforce Cost Analysis (Supplemental Information)
        </h2>
        <div className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_1fr_0.8fr_0.8fr] gap-2 bg-[var(--portal-navy)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white">
            <span>Workforce Cost</span>
            <span className="text-right">Amount</span>
            <span className="text-right">% of Revenue</span>
            <span className="text-right">Prior Round</span>
            <span className="text-right">% of Revenue</span>
            <span className="text-right">Change %</span>
          </div>
          {workforceRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_1fr_0.8fr_0.8fr] gap-2 border-b border-[var(--portal-sidebar-border)] px-4 py-2 text-xs"
            >
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${row.color}`} />
                {row.label}
              </span>
              <span className="text-right tabular-nums">
                {formatMoneySigned(row.amount)}
              </span>
              <span className="text-right tabular-nums text-[var(--portal-muted)]">
                {revenue > 0
                  ? `${((row.amount / revenue) * 100).toFixed(1)}%`
                  : "—"}
              </span>
              <span className="text-right tabular-nums text-[var(--portal-muted)]">
                {formatMoneySigned(row.prior)}
              </span>
              <span className="text-right tabular-nums text-[var(--portal-muted)]">
                {priorRevenue > 0
                  ? `${((row.prior / priorRevenue) * 100).toFixed(1)}%`
                  : "—"}
              </span>
              <span className="text-right">
                <TrendBadge change={pctChange(row.amount, row.prior)} invert />
              </span>
            </div>
          ))}
          <div className="grid grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_1fr_0.8fr_0.8fr] gap-2 bg-[var(--portal-navy)] px-4 py-2.5 text-xs font-bold text-white">
            <span>Total Workforce Costs</span>
            <span className="text-right tabular-nums">
              {formatMoneySigned(workforceCosts)}
            </span>
            <span className="text-right tabular-nums">{wfPct.toFixed(1)}%</span>
            <span className="text-right tabular-nums">
              {formatMoneySigned(priorWorkforce)}
            </span>
            <span className="text-right tabular-nums">
              {priorWfPct.toFixed(1)}%
            </span>
            <span className="text-right">
              <TrendBadge
                change={pctChange(workforceCosts, priorWorkforce)}
                invert
              />
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--portal-primary)]">
          Profitability Indicators
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetricCard
            label="Operating Margin"
            value={`${opMargin.toFixed(1)}%`}
            priorLabel={`Prior Round ${priorOpMargin.toFixed(1)}%`}
            change={opMargin - priorOpMargin}
            changeUnit="pp"
            icon={<Percent className="h-5 w-5" />}
            iconClass="bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
            valueClass={opMargin < 0 ? "text-red-600" : undefined}
          />
          <SummaryMetricCard
            label="Net Profit Margin"
            value={`${netMargin.toFixed(1)}%`}
            priorLabel={`Prior Round ${priorNetMargin.toFixed(1)}%`}
            change={netMargin - priorNetMargin}
            changeUnit="pp"
            icon={<DollarSign className="h-5 w-5" />}
            iconClass="bg-violet-50 text-[var(--portal-purple)]"
            valueClass={netMargin < 0 ? "text-red-600" : undefined}
          />
          <SummaryMetricCard
            label="Revenue Per Employee"
            value={formatMoneySigned(revPerEe)}
            priorLabel={`Prior Round ${formatMoneySigned(priorRevPerEe)}`}
            change={pctChange(revPerEe, priorRevPerEe)}
            icon={<Users className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-700"
          />
          <SummaryMetricCard
            label="Workforce Cost as % of Revenue"
            value={`${wfPct.toFixed(1)}%`}
            priorLabel={`Prior Round ${priorWfPct.toFixed(1)}%`}
            change={wfPct - priorWfPct}
            changeUnit="pp"
            invertTrend
            icon={<Wallet className="h-5 w-5" />}
            iconClass="bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]"
          />
        </div>
      </section>
    </FinancialReportChrome>
  );
}
