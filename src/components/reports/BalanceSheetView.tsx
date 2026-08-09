"use client";

import { Building2, Landmark, Scale, Wallet } from "lucide-react";
import {
  FinancialReportChrome,
  SummaryMetricCard,
  formatMoneySigned,
  pctChange,
  type FinancialRoundItem,
} from "@/components/reports/FinancialReportChrome";
import { FIGMA_BS, scaleByRevenue } from "@/lib/reports/statement-data";

type Props = {
  roundNumber: number;
  asOfLabel: string;
  rounds: FinancialRoundItem[];
  selectedRoundId?: string | null;
  liveRevenue?: number | null;
  liveCompensation?: number | null;
  liveTurnover?: number | null;
};

function StatementTable({
  title,
  columns,
  sections,
  footer,
}: {
  title: string;
  columns: [string, string, string];
  sections: Array<{
    heading?: string;
    rows: Array<{ label: string; current: number; prior: number; bold?: boolean }>;
  }>;
  footer: { label: string; current: number; prior: number };
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
      <div className="grid grid-cols-[minmax(0,1.4fr)_1fr_1fr] gap-2 bg-[var(--portal-navy)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white">
        <span>{title}</span>
        <span className="text-right">{columns[1]}</span>
        <span className="text-right">{columns[2]}</span>
      </div>
      <div className="divide-y divide-[var(--portal-sidebar-border)]">
        {sections.map((section, si) => (
          <div key={si}>
            {section.heading ? (
              <p className="bg-[#f8fafc] px-4 py-2 text-xs font-bold text-[var(--portal-primary)]">
                {section.heading}
              </p>
            ) : null}
            {section.rows.map((row) => (
              <div
                key={row.label}
                className={`grid grid-cols-[minmax(0,1.4fr)_1fr_1fr] gap-2 px-4 py-2 text-xs ${
                  row.bold ? "bg-[#f1f5f9] font-bold" : ""
                }`}
              >
                <span className="text-[var(--portal-ink)]">{row.label}</span>
                <span className="text-right tabular-nums text-[var(--portal-title)]">
                  {formatMoneySigned(row.current)}
                </span>
                <span className="text-right tabular-nums text-[var(--portal-muted)]">
                  {formatMoneySigned(row.prior)}
                </span>
              </div>
            ))}
          </div>
        ))}
        <div className="grid grid-cols-[minmax(0,1.4fr)_1fr_1fr] gap-2 bg-[var(--portal-navy)] px-4 py-2.5 text-xs font-bold text-white">
          <span>{footer.label}</span>
          <span className="text-right tabular-nums">
            {formatMoneySigned(footer.current)}
          </span>
          <span className="text-right tabular-nums">
            {formatMoneySigned(footer.prior)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function BalanceSheetView({
  roundNumber,
  asOfLabel,
  rounds,
  selectedRoundId,
  liveRevenue,
  liveCompensation,
  liveTurnover,
}: Props) {
  const s = scaleByRevenue(liveRevenue);
  const d = {
    cash: FIGMA_BS.cash * s,
    priorCash: FIGMA_BS.priorCash * s,
    ar: FIGMA_BS.ar * s,
    priorAr: FIGMA_BS.priorAr * s,
    otherCurrent: FIGMA_BS.otherCurrent * s,
    priorOtherCurrent: FIGMA_BS.priorOtherCurrent * s,
    ppe: FIGMA_BS.ppe * s,
    priorPpe: FIGMA_BS.priorPpe * s,
    hrTechAsset: FIGMA_BS.hrTechAsset * s,
    priorHrTechAsset: FIGMA_BS.priorHrTechAsset * s,
    otherLt: FIGMA_BS.otherLt * s,
    priorOtherLt: FIGMA_BS.priorOtherLt * s,
    ap: FIGMA_BS.ap * s,
    priorAp: FIGMA_BS.priorAp * s,
    accruedComp: FIGMA_BS.accruedComp * s,
    priorAccruedComp: FIGMA_BS.priorAccruedComp * s,
    otherCl: FIGMA_BS.otherCl * s,
    priorOtherCl: FIGMA_BS.priorOtherCl * s,
    ltDebt: FIGMA_BS.ltDebt * s,
    priorLtDebt: FIGMA_BS.priorLtDebt * s,
    otherLtLiab: FIGMA_BS.otherLtLiab * s,
    priorOtherLtLiab: FIGMA_BS.priorOtherLtLiab * s,
    contributed: FIGMA_BS.contributed * s,
    priorContributed: FIGMA_BS.priorContributed * s,
    retained: FIGMA_BS.retained * s,
    priorRetained: FIGMA_BS.priorRetained * s,
    compensation: liveCompensation ?? FIGMA_BS.compensation * s,
    recruitment: FIGMA_BS.recruitment * s,
    training: FIGMA_BS.training * s,
    hrTechSpend: FIGMA_BS.hrTechSpend * s,
    turnover: liveTurnover ?? FIGMA_BS.turnover * s,
  };

  const totalCurrent = d.cash + d.ar + d.otherCurrent;
  const priorTotalCurrent = d.priorCash + d.priorAr + d.priorOtherCurrent;
  const totalLt = d.ppe + d.hrTechAsset + d.otherLt;
  const priorTotalLt = d.priorPpe + d.priorHrTechAsset + d.priorOtherLt;
  const totalAssets = totalCurrent + totalLt;
  const priorTotalAssets = priorTotalCurrent + priorTotalLt;

  const totalCl = d.ap + d.accruedComp + d.otherCl;
  const priorTotalCl = d.priorAp + d.priorAccruedComp + d.priorOtherCl;
  const totalLtLiab = d.ltDebt + d.otherLtLiab;
  const priorTotalLtLiab = d.priorLtDebt + d.priorOtherLtLiab;
  const totalLiab = totalCl + totalLtLiab;
  const priorTotalLiab = priorTotalCl + priorTotalLtLiab;
  const totalEquity = d.contributed + d.retained;
  const priorTotalEquity = d.priorContributed + d.priorRetained;
  const workingCapital = totalCurrent - totalCl;
  const priorWorking = priorTotalCurrent - priorTotalCl;

  const currentRatio = totalCl > 0 ? totalCurrent / totalCl : 0;
  const priorCurrentRatio = priorTotalCl > 0 ? priorTotalCurrent / priorTotalCl : 0;
  const debtToAssets = totalAssets > 0 ? (totalLiab / totalAssets) * 100 : 0;
  const priorDebtToAssets =
    priorTotalAssets > 0 ? (priorTotalLiab / priorTotalAssets) * 100 : 0;
  const debtToEquity = totalEquity > 0 ? totalLiab / totalEquity : 0;
  const priorDebtToEquity =
    priorTotalEquity > 0 ? priorTotalLiab / priorTotalEquity : 0;

  const workforceTotal =
    d.compensation + d.recruitment + d.training + d.hrTechSpend + d.turnover;

  return (
    <FinancialReportChrome
      reportLabel="Balance Sheet"
      rounds={rounds}
      selectedRoundId={selectedRoundId}
      title={`Balance Sheet – Round ${roundNumber}`}
      subtitle={`As of ${asOfLabel}`}
      infoText="The Balance Sheet reflects the financial position of the company at the end of the round. Use these reports to understand how your HR decisions are impacting organizational financial health."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          label="Total Assets"
          value={formatMoneySigned(totalAssets)}
          priorLabel={`Prior Round ${formatMoneySigned(priorTotalAssets)}`}
          change={pctChange(totalAssets, priorTotalAssets)}
          icon={<Wallet className="h-5 w-5" />}
          iconClass="bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
        />
        <SummaryMetricCard
          label="Total Liabilities"
          value={formatMoneySigned(totalLiab)}
          priorLabel={`Prior Round ${formatMoneySigned(priorTotalLiab)}`}
          change={pctChange(totalLiab, priorTotalLiab)}
          invertTrend
          icon={<Landmark className="h-5 w-5" />}
          iconClass="bg-red-50 text-red-600"
        />
        <SummaryMetricCard
          label="Total Equity"
          value={formatMoneySigned(totalEquity)}
          priorLabel={`Prior Round ${formatMoneySigned(priorTotalEquity)}`}
          change={pctChange(totalEquity, priorTotalEquity)}
          icon={<Building2 className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-700"
        />
        <SummaryMetricCard
          label="Working Capital"
          value={formatMoneySigned(workingCapital)}
          priorLabel={`Prior Round ${formatMoneySigned(priorWorking)}`}
          change={pctChange(workingCapital, priorWorking)}
          icon={<Scale className="h-5 w-5" />}
          iconClass="bg-violet-50 text-[var(--portal-purple)]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatementTable
          title="Assets"
          columns={["", "Current Round", "Prior Round"]}
          sections={[
            {
              heading: "Current Assets",
              rows: [
                { label: "Cash & Cash Equivalents", current: d.cash, prior: d.priorCash },
                { label: "Accounts Receivable", current: d.ar, prior: d.priorAr },
                {
                  label: "Other Current Assets",
                  current: d.otherCurrent,
                  prior: d.priorOtherCurrent,
                },
                {
                  label: "Total Current Assets",
                  current: totalCurrent,
                  prior: priorTotalCurrent,
                  bold: true,
                },
              ],
            },
            {
              heading: "Long-Term Assets",
              rows: [
                {
                  label: "Property, Plant & Equipment",
                  current: d.ppe,
                  prior: d.priorPpe,
                },
                {
                  label: "HR Technology & Systems",
                  current: d.hrTechAsset,
                  prior: d.priorHrTechAsset,
                },
                {
                  label: "Other Long-Term Assets",
                  current: d.otherLt,
                  prior: d.priorOtherLt,
                },
                {
                  label: "Total Long-Term Assets",
                  current: totalLt,
                  prior: priorTotalLt,
                  bold: true,
                },
              ],
            },
          ]}
          footer={{
            label: "TOTAL ASSETS",
            current: totalAssets,
            prior: priorTotalAssets,
          }}
        />
        <StatementTable
          title="Liabilities & Equity"
          columns={["", "Current Round", "Prior Round"]}
          sections={[
            {
              heading: "Current Liabilities",
              rows: [
                { label: "Accounts Payable", current: d.ap, prior: d.priorAp },
                {
                  label: "Accrued Compensation & Benefits",
                  current: d.accruedComp,
                  prior: d.priorAccruedComp,
                },
                {
                  label: "Other Current Liabilities",
                  current: d.otherCl,
                  prior: d.priorOtherCl,
                },
                {
                  label: "Total Current Liabilities",
                  current: totalCl,
                  prior: priorTotalCl,
                  bold: true,
                },
              ],
            },
            {
              heading: "Long-Term Liabilities",
              rows: [
                { label: "Long-Term Debt", current: d.ltDebt, prior: d.priorLtDebt },
                {
                  label: "Other Long-Term Obligations",
                  current: d.otherLtLiab,
                  prior: d.priorOtherLtLiab,
                },
                {
                  label: "Total Long-Term Liabilities",
                  current: totalLtLiab,
                  prior: priorTotalLtLiab,
                  bold: true,
                },
                {
                  label: "Total Liabilities",
                  current: totalLiab,
                  prior: priorTotalLiab,
                  bold: true,
                },
              ],
            },
            {
              heading: "Shareholders’ Equity",
              rows: [
                {
                  label: "Contributed Capital",
                  current: d.contributed,
                  prior: d.priorContributed,
                },
                {
                  label: "Retained Earnings",
                  current: d.retained,
                  prior: d.priorRetained,
                },
                {
                  label: "Total Equity",
                  current: totalEquity,
                  prior: priorTotalEquity,
                  bold: true,
                },
              ],
            },
          ]}
          footer={{
            label: "TOTAL LIABILITIES & EQUITY",
            current: totalAssets,
            prior: priorTotalAssets,
          }}
        />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--portal-primary)]">
          Financial Health Indicators
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetricCard
            label="Current Ratio"
            value={`${currentRatio.toFixed(2)} : 1`}
            priorLabel={`Prior Round ${priorCurrentRatio.toFixed(2)} : 1`}
            change={pctChange(currentRatio, priorCurrentRatio)}
            icon={<Scale className="h-5 w-5" />}
            iconClass="bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
          />
          <SummaryMetricCard
            label="Debt-to-Assets"
            value={`${debtToAssets.toFixed(1)}%`}
            priorLabel={`Prior Round ${priorDebtToAssets.toFixed(1)}%`}
            change={debtToAssets - priorDebtToAssets}
            changeUnit="pp"
            invertTrend
            icon={<Building2 className="h-5 w-5" />}
            iconClass="bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]"
          />
          <SummaryMetricCard
            label="Debt-to-Equity"
            value={`${debtToEquity.toFixed(2)} : 1`}
            priorLabel={`Prior Round ${priorDebtToEquity.toFixed(2)} : 1`}
            change={debtToEquity - priorDebtToEquity}
            changeUnit=""
            invertTrend
            icon={<Landmark className="h-5 w-5" />}
            iconClass="bg-violet-50 text-[var(--portal-purple)]"
          />
          <SummaryMetricCard
            label="Cash Position"
            value={formatMoneySigned(d.cash)}
            priorLabel={`Prior Round ${formatMoneySigned(d.priorCash)}`}
            change={pctChange(d.cash, d.priorCash)}
            icon={<Wallet className="h-5 w-5" />}
            iconClass="bg-sky-50 text-sky-700"
          />
        </div>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
          Workforce Financial Impact (Supplemental Information)
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Total Compensation & Benefits", value: d.compensation },
            { label: "Recruitment Investment", value: d.recruitment },
            { label: "Training & Development Investment", value: d.training },
            { label: "HR Technology Investment", value: d.hrTechSpend },
            { label: "Turnover Cost", value: d.turnover },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[11px] font-semibold text-[var(--portal-muted)]">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--portal-title)]">
                {formatMoneySigned(item.value)}
              </p>
            </div>
          ))}
          <div className="rounded-xl border border-emerald-300 bg-white p-3 text-center">
            <p className="text-[11px] font-semibold text-emerald-800">
              Total Workforce Investment
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {formatMoneySigned(workforceTotal)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-[var(--portal-muted)]">
          Note: Workforce Financial Impact represents key HR-related investments
          and costs that influence the financial position of the organization.
        </p>
      </section>
    </FinancialReportChrome>
  );
}
