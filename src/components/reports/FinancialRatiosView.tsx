"use client";

import {
  ArrowUpRight,
  DollarSign,
  Percent,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  FinancialReportChrome,
  SummaryMetricCard,
  TrendBadge,
  formatMoneySigned,
  pctChange,
  type FinancialRoundItem,
} from "@/components/reports/FinancialReportChrome";
import { FIGMA_BS, FIGMA_PL, scaleByRevenue } from "@/lib/reports/statement-data";

type Props = {
  roundNumber: number;
  asOfLabel: string;
  rounds: FinancialRoundItem[];
  selectedRoundId?: string | null;
  liveRevenue?: number | null;
  liveProfit?: number | null;
  liveProfitMargin?: number | null;
  liveHeadcount?: number | null;
};

export function FinancialRatiosView({
  roundNumber,
  asOfLabel,
  rounds,
  selectedRoundId,
  liveRevenue,
  liveProfit,
  liveProfitMargin,
  liveHeadcount,
}: Props) {
  const s = scaleByRevenue(liveRevenue);

  // Derive from same Balance Sheet / P&L template so ratios stay coherent
  const totalCurrent =
    (FIGMA_BS.cash + FIGMA_BS.ar + FIGMA_BS.otherCurrent) * s;
  const priorTotalCurrent =
    (FIGMA_BS.priorCash + FIGMA_BS.priorAr + FIGMA_BS.priorOtherCurrent) * s;
  const totalCl =
    (FIGMA_BS.ap + FIGMA_BS.accruedComp + FIGMA_BS.otherCl) * s;
  const priorTotalCl =
    (FIGMA_BS.priorAp + FIGMA_BS.priorAccruedComp + FIGMA_BS.priorOtherCl) * s;
  const totalAssets =
    totalCurrent +
    (FIGMA_BS.ppe + FIGMA_BS.hrTechAsset + FIGMA_BS.otherLt) * s;
  const priorTotalAssets =
    priorTotalCurrent +
    (FIGMA_BS.priorPpe + FIGMA_BS.priorHrTechAsset + FIGMA_BS.priorOtherLt) * s;
  const totalLiab =
    totalCl + (FIGMA_BS.ltDebt + FIGMA_BS.otherLtLiab) * s;
  const priorTotalLiab =
    priorTotalCl + (FIGMA_BS.priorLtDebt + FIGMA_BS.priorOtherLtLiab) * s;
  const totalEquity =
    (FIGMA_BS.contributed + FIGMA_BS.retained) * s;
  const priorTotalEquity =
    (FIGMA_BS.priorContributed + FIGMA_BS.priorRetained) * s;

  const revenue = liveRevenue ?? FIGMA_PL.revenue * s;
  const priorRevenue = FIGMA_PL.priorRevenue * s;
  const totalOpEx =
    (FIGMA_PL.wages +
      FIGMA_PL.benefits +
      FIGMA_PL.recruitment +
      FIGMA_PL.training +
      FIGMA_PL.performance +
      FIGMA_PL.relations +
      FIGMA_PL.hrTech +
      FIGMA_PL.turnover +
      FIGMA_PL.otherOpEx) *
    s;
  const priorTotalOpEx =
    (FIGMA_PL.priorWages +
      FIGMA_PL.priorBenefits +
      FIGMA_PL.priorRecruitment +
      FIGMA_PL.priorTraining +
      FIGMA_PL.priorPerformance +
      FIGMA_PL.priorRelations +
      FIGMA_PL.priorHrTech +
      FIGMA_PL.priorTurnover +
      FIGMA_PL.priorOtherOpEx) *
    s;
  const operatingIncome = revenue - totalOpEx;
  const priorOperating = priorRevenue - priorTotalOpEx;
  const netProfit =
    liveProfit ?? operatingIncome - FIGMA_PL.interest * s;
  const priorNet = priorOperating - FIGMA_PL.priorInterest * s;
  const headcount = liveHeadcount ?? FIGMA_PL.headcount;
  const priorHeadcount = FIGMA_PL.priorHeadcount;

  const currentRatio = totalCl > 0 ? totalCurrent / totalCl : 0;
  const priorCurrentRatio = priorTotalCl > 0 ? priorTotalCurrent / priorTotalCl : 0;
  const debtToAssets = totalAssets > 0 ? (totalLiab / totalAssets) * 100 : 0;
  const priorDebtToAssets =
    priorTotalAssets > 0 ? (priorTotalLiab / priorTotalAssets) * 100 : 0;
  const debtToEquity = totalEquity > 0 ? totalLiab / totalEquity : 0;
  const priorDebtToEquity =
    priorTotalEquity > 0 ? priorTotalLiab / priorTotalEquity : 0;
  const opMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;
  const priorOpMargin =
    priorRevenue > 0 ? (priorOperating / priorRevenue) * 100 : 0;
  const netMargin =
    liveProfitMargin ?? (revenue > 0 ? (netProfit / revenue) * 100 : 0);
  const priorNetMargin = priorRevenue > 0 ? (priorNet / priorRevenue) * 100 : 0;
  const revPerEe = headcount > 0 ? revenue / headcount : 0;
  const priorRevPerEe = priorHeadcount > 0 ? priorRevenue / priorHeadcount : 0;

  const cards = [
    {
      label: "Current Ratio",
      value: currentRatio.toFixed(2),
      prior: `Prior Round ${priorCurrentRatio.toFixed(2)}`,
      change: pctChange(currentRatio, priorCurrentRatio),
      unit: "%" as const,
      icon: Scale,
      iconClass: "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]",
    },
    {
      label: "Debt-to-Assets Ratio",
      value: `${debtToAssets.toFixed(1)}%`,
      prior: `Prior Round ${priorDebtToAssets.toFixed(1)}%`,
      change: debtToAssets - priorDebtToAssets,
      unit: "pp" as const,
      invert: true,
      icon: Percent,
      iconClass: "bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]",
    },
    {
      label: "Debt-to-Equity Ratio",
      value: debtToEquity.toFixed(2),
      prior: `Prior Round ${priorDebtToEquity.toFixed(2)}`,
      change: pctChange(debtToEquity, priorDebtToEquity),
      unit: "%" as const,
      invert: true,
      icon: ArrowUpRight,
      iconClass: "bg-violet-50 text-[var(--portal-purple)]",
    },
    {
      label: "Operating Margin",
      value: `${opMargin.toFixed(1)}%`,
      prior: `Prior Round ${priorOpMargin.toFixed(1)}%`,
      change: opMargin - priorOpMargin,
      unit: "pp" as const,
      icon: TrendingUp,
      iconClass: "bg-emerald-50 text-emerald-700",
      valueClass: opMargin < 0 ? "text-red-600" : undefined,
    },
    {
      label: "Net Profit Margin",
      value: `${netMargin.toFixed(1)}%`,
      prior: `Prior Round ${priorNetMargin.toFixed(1)}%`,
      change: netMargin - priorNetMargin,
      unit: "pp" as const,
      icon: DollarSign,
      iconClass: "bg-sky-50 text-sky-700",
      valueClass: netMargin < 0 ? "text-red-600" : undefined,
    },
    {
      label: "Revenue Per Employee",
      value: formatMoneySigned(revPerEe),
      prior: `Prior Round ${formatMoneySigned(priorRevPerEe)}`,
      change: pctChange(revPerEe, priorRevPerEe),
      unit: "%" as const,
      icon: Users,
      iconClass: "bg-teal-50 text-teal-700",
    },
  ];

  const summaryRows = [
    {
      label: "Current Ratio",
      current: currentRatio.toFixed(2),
      prior: priorCurrentRatio.toFixed(2),
      change: (currentRatio - priorCurrentRatio).toFixed(2),
      changePct: pctChange(currentRatio, priorCurrentRatio),
      unit: "%" as const,
    },
    {
      label: "Debt-to-Assets Ratio",
      current: `${debtToAssets.toFixed(1)}%`,
      prior: `${priorDebtToAssets.toFixed(1)}%`,
      change: `${debtToAssets - priorDebtToAssets >= 0 ? "+" : ""}${(debtToAssets - priorDebtToAssets).toFixed(1)} pp`,
      changePct: debtToAssets - priorDebtToAssets,
      unit: "pp" as const,
    },
    {
      label: "Debt-to-Equity Ratio",
      current: debtToEquity.toFixed(2),
      prior: priorDebtToEquity.toFixed(2),
      change: `${debtToEquity - priorDebtToEquity >= 0 ? "+" : ""}${(debtToEquity - priorDebtToEquity).toFixed(2)}`,
      changePct: pctChange(debtToEquity, priorDebtToEquity),
      unit: "%" as const,
    },
    {
      label: "Operating Margin",
      current: `${opMargin.toFixed(1)}%`,
      prior: `${priorOpMargin.toFixed(1)}%`,
      change: `${opMargin - priorOpMargin >= 0 ? "+" : ""}${(opMargin - priorOpMargin).toFixed(1)} pp`,
      changePct: opMargin - priorOpMargin,
      unit: "pp" as const,
    },
    {
      label: "Net Profit Margin",
      current: `${netMargin.toFixed(1)}%`,
      prior: `${priorNetMargin.toFixed(1)}%`,
      change: `${netMargin - priorNetMargin >= 0 ? "+" : ""}${(netMargin - priorNetMargin).toFixed(1)} pp`,
      changePct: netMargin - priorNetMargin,
      unit: "pp" as const,
    },
    {
      label: "Revenue per Employee",
      current: formatMoneySigned(revPerEe),
      prior: formatMoneySigned(priorRevPerEe),
      change: formatMoneySigned(revPerEe - priorRevPerEe),
      changePct: pctChange(revPerEe, priorRevPerEe),
      unit: "%" as const,
    },
  ];

  const glossary = [
    {
      label: "Current Ratio",
      icon: Scale,
      text: "Ability to meet short-term financial obligations by comparing current assets to current liabilities.",
    },
    {
      label: "Debt-to-Assets Ratio",
      icon: Percent,
      text: "Percentage of organizational assets that are financed through debt.",
    },
    {
      label: "Debt-to-Equity Ratio",
      icon: ArrowUpRight,
      text: "Relationship between debt financing and shareholder equity.",
    },
    {
      label: "Operating Margin",
      icon: TrendingUp,
      text: "Operating income generated from each dollar of revenue.",
    },
    {
      label: "Net Profit Margin",
      icon: DollarSign,
      text: "Final profit generated from each dollar of revenue after all expenses.",
    },
    {
      label: "Revenue per Employee",
      icon: Users,
      text: "Revenue generated relative to the size of the workforce.",
    },
  ];

  return (
    <FinancialReportChrome
      reportLabel="Financial Ratio Report"
      rounds={rounds}
      selectedRoundId={selectedRoundId}
      title={`Financial Ratio Report – Round ${roundNumber}`}
      subtitle={`Financial Health & Workforce Efficiency · As of ${asOfLabel}`}
      infoText="Financial ratios provide a quick view of the organization’s financial health and efficiency. Use this report to track trends and understand how your decisions impact key financial outcomes."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <SummaryMetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              priorLabel={card.prior}
              change={card.change}
              changeUnit={card.unit}
              invertTrend={card.invert}
              icon={<Icon className="h-5 w-5" />}
              iconClass={card.iconClass}
              valueClass={card.valueClass}
            />
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="bg-[var(--portal-navy)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white">
          Financial Ratio Summary
        </div>
        <div className="grid grid-cols-[minmax(0,1.4fr)_1fr_1fr_1fr_1fr] gap-2 border-b border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
          <span>Ratio</span>
          <span className="text-right">Current Round</span>
          <span className="text-right">Prior Round</span>
          <span className="text-right">Change</span>
          <span className="text-right">Change % / pp</span>
        </div>
        {summaryRows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(0,1.4fr)_1fr_1fr_1fr_1fr] gap-2 border-b border-[var(--portal-sidebar-border)] px-4 py-2.5 text-xs"
          >
            <span className="font-medium text-[var(--portal-title)]">
              {row.label}
            </span>
            <span className="text-right tabular-nums font-semibold">
              {row.current}
            </span>
            <span className="text-right tabular-nums text-[var(--portal-muted)]">
              {row.prior}
            </span>
            <span className="text-right tabular-nums">{row.change}</span>
            <span className="text-right">
              <TrendBadge change={row.changePct} unit={row.unit} />
            </span>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--portal-primary)]">
          Understanding the Ratios
        </h2>
        <ul className="mt-4 divide-y divide-[var(--portal-sidebar-border)]">
          {glossary.map((g) => {
            const Icon = g.icon;
            return (
              <li
                key={g.label}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="flex min-w-[200px] items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--portal-title)]">
                    {g.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--portal-muted)]">
                  {g.text}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </FinancialReportChrome>
  );
}
