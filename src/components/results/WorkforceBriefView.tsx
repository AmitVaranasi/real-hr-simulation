"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  ChevronRight,
  Download,
  Percent,
  Settings,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";

export interface RoundListItem {
  id: string;
  roundId: string;
  roundNumber: number;
  dateLabel: string;
  href: string;
}

export interface WorkforceBriefData {
  teamName: string;
  industry: string;
  strategy: string;
  roundNumber: number;
  roundStatus: string;

  // BSC
  totalScore: number;
  scoreFinancial: number;
  scoreEmployee: number;
  scoreProcess: number;
  scoreLearning: number;
  maxFinancial: number;
  maxEmployee: number;
  maxProcess: number;
  maxLearning: number;

  // Strategic KPIs
  revenue: number;
  profit: number;
  stockPrice: number;
  marketShare: number;
  profitMargin: number;
  headcount: number;
  requiredHeadcount: number;

  // Workforce metrics
  turnoverRate: number;
  averageSalary: number;
  compensationRatio: number;
  satisfaction: number;
  engagement: number;
  costPerHire: number;
  timeToFill: number;
  hiringQuality: number;
  turnoverCost: number;
  absenteeismRate: number;
  trainingRoi: number;
  trainingEffectiveness: number;
  successionPipeline: number;
  reviewCoverage: number;
  productivityIndex: number;
  budgetAdherence: number;
  deiScore: number;
  hrTechScore: number;

  rounds?: RoundListItem[];
  selectedRoundId?: string | null;
  reflectionContent?: string | null;
  onSaveReflection?: (content: string) => Promise<void>;
  onDownloadPdf?: () => void;
}

const DEFAULT_BRIEF_DATA: WorkforceBriefData = {
  teamName: "Crazy Managers",
  industry: "Manufacturing",
  strategy: "Focus",
  roundNumber: 1,
  roundStatus: "Open",
  totalScore: 52.3,
  scoreFinancial: 10.4,
  scoreEmployee: 20.3,
  scoreProcess: 17.2,
  scoreLearning: 4.5,
  maxFinancial: 20,
  maxEmployee: 30,
  maxProcess: 20,
  maxLearning: 30,
  revenue: 50_117_000,
  profit: -11_227_430,
  stockPrice: 22.335,
  marketShare: 15.5,
  profitMargin: -22.4,
  headcount: 281,
  requiredHeadcount: 420,
  turnoverRate: 11.68,
  averageSalary: 68_450,
  compensationRatio: 34.06,
  satisfaction: 75.7,
  engagement: 71.3,
  costPerHire: 4143,
  timeToFill: 35.1,
  hiringQuality: 0,
  turnoverCost: 0,
  absenteeismRate: 5.28,
  trainingRoi: 0,
  trainingEffectiveness: 0.03,
  successionPipeline: 35.01,
  reviewCoverage: 86,
  productivityIndex: 0,
  budgetAdherence: 0,
  deiScore: 19.5,
  hrTechScore: 20,
  rounds: [],
};

type Tone = "excellent" | "moderate" | "poor" | "critical" | "strong";

function toneClass(tone: Tone) {
  if (tone === "excellent" || tone === "strong") return "text-emerald-700";
  if (tone === "moderate") return "text-[var(--portal-brand)]";
  if (tone === "poor") return "text-[var(--portal-purple)]";
  return "text-red-600";
}

function toneBg(tone: Tone) {
  if (tone === "excellent" || tone === "strong") return "bg-emerald-600";
  if (tone === "moderate") return "bg-[var(--portal-brand)]";
  if (tone === "poor") return "bg-[var(--portal-purple)]";
  return "bg-red-600";
}

function metricTone(
  value: number,
  kind: "costPerHire" | "satisfaction" | "turnover" | "trainingRoi" | "engagement" | "dei" | "budget"
): Tone {
  if (kind === "costPerHire") return value > 0 && value < 6000 ? "excellent" : "moderate";
  if (kind === "satisfaction" || kind === "engagement") {
    if (value >= 80) return "excellent";
    if (value >= 60) return "moderate";
    return "critical";
  }
  if (kind === "turnover") {
    if (value <= 10) return "excellent";
    if (value <= 15) return "moderate";
    return "critical";
  }
  if (kind === "trainingRoi") {
    if (value >= 50) return "excellent";
    if (value >= 20) return "moderate";
    return "poor";
  }
  if (kind === "dei") {
    if (value >= 70) return "excellent";
    if (value >= 40) return "moderate";
    return "critical";
  }
  // budget
  if (value >= 80) return "excellent";
  if (value >= 50) return "moderate";
  return "critical";
}

function ProgressBar({
  label,
  score,
  max,
  color,
}: {
  label: string;
  score: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (score / max) * 100) : 0;
  return (
    <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-[var(--portal-title)]">{label}</span>
        <span className="font-semibold text-[var(--portal-title)]">
          {score.toFixed(1)} / {max}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef1f4]">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-12 text-right text-xs font-semibold text-[var(--portal-muted)]">
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function padRounds(
  rounds: RoundListItem[],
  currentRound: number
): Array<RoundListItem & { placeholder?: boolean }> {
  const byNumber = new Map(rounds.map((r) => [r.roundNumber, r]));
  const maxShown = Math.max(5, currentRound, ...rounds.map((r) => r.roundNumber));
  return Array.from({ length: maxShown }, (_, i) => {
    const n = i + 1;
    return (
      byNumber.get(n) ?? {
        id: `placeholder-${n}`,
        roundId: "",
        roundNumber: n,
        dateLabel: "—",
        href: "#",
        placeholder: true,
      }
    );
  });
}

export function WorkforceBriefView({
  data = DEFAULT_BRIEF_DATA,
}: {
  data?: Partial<WorkforceBriefData>;
}) {
  const brief = { ...DEFAULT_BRIEF_DATA, ...data };
  const [reflectionText, setReflectionText] = useState(
    brief.reflectionContent || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  async function handleReflectionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brief.onSaveReflection) return;
    setIsSubmitting(true);
    setSubmittedMessage(null);
    try {
      await brief.onSaveReflection(reflectionText);
      setSubmittedMessage("Reflection submitted successfully!");
    } catch {
      setSubmittedMessage("Error saving reflection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const perspectives = [
    {
      label: "Financial",
      score: brief.scoreFinancial,
      max: brief.maxFinancial,
      icon: Wallet,
      color: "text-[var(--portal-primary)]",
      iconBg: "bg-[var(--portal-primary-soft)]",
      body: "Financial perspective reflects training ROI, hiring efficiency, compensation ratio, and budget discipline.",
      tip:
        brief.scoreFinancial / brief.maxFinancial >= 0.65
          ? "Strong performance in Financial. Maintain momentum while optimizing spend."
          : "Room to grow in Financial. Prioritize investments that improve Financial metrics.",
      tipTone: (brief.scoreFinancial / brief.maxFinancial >= 0.65
        ? "strong"
        : "moderate") as Tone,
    },
    {
      label: "Employee",
      score: brief.scoreEmployee,
      max: brief.maxEmployee,
      icon: Users,
      color: "text-emerald-700",
      iconBg: "bg-emerald-50",
      body: "Employee perspective captures satisfaction, retention, engagement, and DEI outcomes.",
      tip:
        brief.scoreEmployee / brief.maxEmployee >= 0.65
          ? `Strong performance in Employee (${brief.scoreEmployee.toFixed(1)}/${brief.maxEmployee}). Maintain momentum while optimizing spend.`
          : "Room to grow in Employee. Prioritize investments that improve Employee metrics.",
      tipTone: (brief.scoreEmployee / brief.maxEmployee >= 0.65
        ? "strong"
        : "moderate") as Tone,
    },
    {
      label: "Internal Process",
      score: brief.scoreProcess,
      max: brief.maxProcess,
      icon: Settings,
      color: "text-[var(--portal-purple)]",
      iconBg: "bg-violet-50",
      body: "Internal process perspective measures hiring speed, turnover, absenteeism, and review coverage.",
      tip:
        brief.scoreProcess / brief.maxProcess >= 0.65
          ? "Strong performance in Internal Process. Maintain momentum while optimizing spend."
          : "Room to grow in Internal Process. Maintain momentum while optimizing spend.",
      tipTone: (brief.scoreProcess / brief.maxProcess >= 0.65
        ? "strong"
        : "moderate") as Tone,
    },
    {
      label: "Learning & Growth",
      score: brief.scoreLearning,
      max: brief.maxLearning,
      icon: Target,
      color: "text-[var(--portal-brand)]",
      iconBg: "bg-[var(--portal-brand-soft)]",
      body: "Learning & growth perspective evaluates training, succession, HR technology, and DEI maturity.",
      tip:
        brief.scoreLearning / brief.maxLearning >= 0.65
          ? "Strong performance in Learning & Growth. Maintain momentum while optimizing spend."
          : "Room to grow in Learning & Growth. Prioritize investments that improve Learning & Growth metrics.",
      tipTone: (brief.scoreLearning / brief.maxLearning >= 0.65
        ? "strong"
        : "moderate") as Tone,
    },
  ];

  const strategicKpis = [
    {
      label: "Revenue",
      value: formatCurrency(brief.revenue),
      negative: brief.revenue < 0,
      icon: ArrowUpRight,
      iconClass: "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]",
    },
    {
      label: "Profit",
      value: formatCurrency(brief.profit),
      negative: brief.profit < 0,
      icon: Wallet,
      iconClass: "bg-red-50 text-red-600",
    },
    {
      label: "Stock Price",
      value: brief.stockPrice.toFixed(3),
      negative: false,
      icon: ArrowUpRight,
      iconClass: "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]",
    },
    {
      label: "Market Share",
      value: formatPercent(brief.marketShare),
      negative: false,
      icon: Target,
      iconClass: "bg-violet-50 text-[var(--portal-purple)]",
    },
    {
      label: "Profit Margin",
      value: formatPercent(brief.profitMargin),
      negative: brief.profitMargin < 0,
      icon: Percent,
      iconClass: "bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]",
    },
    {
      label: "Headcount",
      value: String(brief.headcount),
      negative: false,
      icon: Users,
      iconClass: "bg-sky-50 text-sky-700",
    },
  ];

  const metricGroups = [
    {
      title: "Talent Acquisition",
      header: "bg-[var(--portal-primary)]",
      rows: [
        { label: "Cost per Hire", value: formatCurrency(brief.costPerHire) },
        { label: "Time to Fill (days)", value: brief.timeToFill.toFixed(2) },
        {
          label: "Hiring Quality",
          value: `${brief.hiringQuality.toFixed(1)} / 100`,
        },
      ],
    },
    {
      title: "Workforce & Employee Experience",
      header: "bg-emerald-600",
      rows: [
        { label: "Turnover Rate (%)", value: brief.turnoverRate.toFixed(2) },
        { label: "Turnover Cost", value: formatCurrency(brief.turnoverCost) },
        {
          label: "Employee Satisfaction",
          value: `${brief.satisfaction.toFixed(1)} / 100`,
        },
        {
          label: "Engagement",
          value: `${brief.engagement.toFixed(1)} / 100`,
        },
        {
          label: "Absenteeism (days)",
          value: brief.absenteeismRate.toFixed(2),
        },
      ],
    },
    {
      title: "Learning & Talent Development",
      header: "bg-[var(--portal-purple)]",
      rows: [
        { label: "Training ROI (%)", value: brief.trainingRoi.toFixed(2) },
        {
          label: "Training Effectiveness (%)",
          value: brief.trainingEffectiveness.toFixed(2),
        },
        {
          label: "Succession Pipeline (%)",
          value: brief.successionPipeline.toFixed(2),
        },
      ],
    },
    {
      title: "Performance Management",
      header: "bg-teal-600",
      rows: [
        {
          label: "Review Coverage (%)",
          value: brief.reviewCoverage.toFixed(2),
        },
        {
          label: "Productivity Index (%)",
          value: brief.productivityIndex.toFixed(2),
        },
      ],
    },
    {
      title: "Compensation & HR Financials",
      header: "bg-[var(--portal-brand)]",
      rows: [
        {
          label: "Compensation Ratio (%)",
          value: brief.compensationRatio.toFixed(2),
        },
        {
          label: "Budget Adherence (%)",
          value: brief.budgetAdherence.toFixed(2),
        },
      ],
    },
    {
      title: "Workforce Inclusion",
      header: "bg-red-600",
      rows: [
        { label: "DEI Score", value: `${brief.deiScore.toFixed(1)} / 100` },
      ],
    },
    {
      title: "HR Technology & Capability",
      header: "bg-sky-700",
      rows: [
        {
          label: "HR Tech Score",
          value: `${brief.hrTechScore.toFixed(1)} / 100`,
        },
      ],
    },
  ];

  const feedbackMetrics = [
    {
      label: "Cost per Hire",
      value: formatCurrency(brief.costPerHire),
      tone: metricTone(brief.costPerHire, "costPerHire"),
      icon: "$",
      text: `Cost per Hire is ${formatCurrency(brief.costPerHire)} (${metricTone(brief.costPerHire, "costPerHire")}). Review related HR module decisions to improve this metric.`,
    },
    {
      label: "Employee Satisfaction",
      value: `${Math.round(brief.satisfaction)} / 100`,
      tone: metricTone(brief.satisfaction, "satisfaction"),
      icon: "♙",
      text: `Employee Satisfaction is ${Math.round(brief.satisfaction)}/100 (${metricTone(brief.satisfaction, "satisfaction")}). Review related HR module decisions to improve this metric.`,
    },
    {
      label: "Turnover Rate",
      value: `${brief.turnoverRate.toFixed(1)}%`,
      tone: metricTone(brief.turnoverRate, "turnover"),
      icon: "◌",
      text: `Turnover Rate is ${brief.turnoverRate.toFixed(1)}% (${metricTone(brief.turnoverRate, "turnover")}). Review related HR module decisions to improve this metric.`,
    },
    {
      label: "Training ROI",
      value: `${brief.trainingRoi.toFixed(1)}%`,
      tone: metricTone(brief.trainingRoi, "trainingRoi"),
      icon: "◆",
      text: `Training ROI is ${brief.trainingRoi.toFixed(1)}% (${metricTone(brief.trainingRoi, "trainingRoi")}). Review related HR module decisions to improve this metric.`,
    },
    {
      label: "Engagement",
      value: `${Math.round(brief.engagement)} / 100`,
      tone: metricTone(brief.engagement, "engagement"),
      icon: "↗",
      text: `Engagement is ${Math.round(brief.engagement)}/100 (${metricTone(brief.engagement, "engagement")}). Review related HR module decisions to improve this metric.`,
    },
    {
      label: "DEI Score",
      value: `${Math.round(brief.deiScore)} / 100`,
      tone: metricTone(brief.deiScore, "dei"),
      icon: "♙",
      text: `DEI Score is ${Math.round(brief.deiScore)}/100 (${metricTone(brief.deiScore, "dei")}). Review related HR module decisions to improve this metric.`,
    },
    {
      label: "Budget Adherence",
      value: `${brief.budgetAdherence.toFixed(1)}%`,
      tone: metricTone(brief.budgetAdherence, "budget"),
      icon: "◔",
      text: `Budget Adherence is ${brief.budgetAdherence.toFixed(1)}% (${metricTone(brief.budgetAdherence, "budget")}). Review related HR module decisions to improve this metric.`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3">
          <h2 className="text-sm font-bold text-[var(--portal-title)]">
            The Workforce Brief
          </h2>
          <p className="mt-1 text-[0.6875rem] text-[var(--portal-muted)]">
            Select a round to review results
          </p>
          <ul className="mt-3 space-y-2">
            {padRounds(brief.rounds ?? [], brief.roundNumber).map((r) => {
              const active =
                !r.placeholder &&
                (brief.selectedRoundId === r.roundId ||
                  r.roundNumber === brief.roundNumber);
              const inner = (
                <>
                  <div>
                    <p
                      className={`text-[0.8125rem] font-semibold ${
                        active
                          ? "text-[var(--portal-primary)]"
                          : r.placeholder
                            ? "text-[var(--portal-muted)]"
                            : "text-[var(--portal-title)]"
                      }`}
                    >
                      The Workforce Brief –
                    </p>
                    <p
                      className={`text-[0.8125rem] font-semibold ${
                        active
                          ? "text-[var(--portal-primary)]"
                          : r.placeholder
                            ? "text-[var(--portal-muted)]"
                            : "text-[var(--portal-title)]"
                      }`}
                    >
                      Round {r.roundNumber} Results
                    </p>
                    <p className="mt-0.5 text-[0.625rem] text-[var(--portal-muted)]">
                      {r.dateLabel}
                    </p>
                  </div>
                  <ChevronRight
                    className={`mt-1 h-4 w-4 shrink-0 ${
                      active
                        ? "text-[var(--portal-primary)]"
                        : "text-[var(--portal-muted)]"
                    }`}
                  />
                </>
              );
              return (
                <li key={r.id}>
                  {r.placeholder ? (
                    <div className="flex items-start justify-between gap-2 rounded-lg border border-dashed border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-3 py-2">
                      {inner}
                    </div>
                  ) : (
                    <Link
                      href={r.href}
                      className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 transition-colors ${
                        active
                          ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)]"
                          : "border-[var(--portal-sidebar-border)] bg-[#f8fafc] hover:border-[var(--portal-primary)]/40"
                      }`}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-[1.375rem] font-bold leading-tight text-[var(--portal-title)]">
              The Workforce Brief – Round {brief.roundNumber} Results
            </h1>
            <button
              type="button"
              onClick={() => brief.onDownloadPdf?.()}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--portal-title)] hover:bg-[#f8fafc]"
            >
              <Download className="h-4 w-4" />
              Download PDF Report
            </button>
          </div>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4">
            <h2 className="text-lg font-bold text-[var(--portal-title)]">
              HR Balance Scorecard
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
              <div>
                <p className="text-[2.75rem] font-bold leading-none tracking-tight text-[var(--portal-primary)]">
                  {brief.totalScore.toFixed(1)}%
                </p>
                <p className="mt-2 max-w-[200px] text-xs leading-relaxed text-[var(--portal-muted)]">
                  Overall effectiveness of your team&apos;s HR decisions this
                  round.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ProgressBar
                  label="Financial"
                  score={brief.scoreFinancial}
                  max={brief.maxFinancial}
                  color="bg-[var(--portal-primary)]"
                />
                <ProgressBar
                  label="Employee"
                  score={brief.scoreEmployee}
                  max={brief.maxEmployee}
                  color="bg-emerald-500"
                />
                <ProgressBar
                  label="Internal Process"
                  score={brief.scoreProcess}
                  max={brief.maxProcess}
                  color="bg-sky-500"
                />
                <ProgressBar
                  label="Learning & Growth"
                  score={brief.scoreLearning}
                  max={brief.maxLearning}
                  color="bg-[var(--portal-brand)]"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[0.75rem] font-bold uppercase tracking-wider text-[var(--portal-primary)]">
              Strategic Performance Metrics KPIs
            </h2>
            <div className="grid grid-cols-6 gap-2">
              {strategicKpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={kpi.label}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-2 py-2.5"
                  >
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${kpi.iconClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[0.5625rem] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                        {kpi.label}
                      </p>
                      <p
                        className={`mt-0.5 whitespace-nowrap text-sm font-bold leading-tight tabular-nums ${
                          kpi.negative
                            ? "text-red-600"
                            : "text-[var(--portal-title)]"
                        }`}
                      >
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[0.75rem] font-bold uppercase tracking-wider text-[var(--portal-title)]">
              Feedback: Perspective Summaries
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {perspectives.map((p) => {
                const Icon = p.icon;
                return (
                  <article
                    key={p.label}
                    className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[0.8125rem] font-bold text-[var(--portal-title)]">
                          {p.label}
                        </h3>
                        <p className="mt-0.5 text-sm font-bold text-[var(--portal-title)]">
                          {p.score.toFixed(1)} / {p.max}
                        </p>
                      </div>
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${p.iconBg} ${p.color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="mt-2 text-[0.6875rem] leading-snug text-[var(--portal-muted)]">
                      {p.body}
                    </p>
                    <p
                      className={`mt-2 text-[0.6875rem] font-semibold leading-snug ${toneClass(p.tipTone)}`}
                    >
                      {p.tip}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[0.75rem] font-bold uppercase tracking-wider text-[var(--portal-title)]">
              Workforce Performance Metrics
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {metricGroups.map((g) => (
                <div
                  key={g.title}
                  className="min-w-0 overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white"
                >
                  <div
                    className={`${g.header} px-1.5 py-2 text-center text-[0.5625rem] font-bold uppercase leading-tight tracking-wide text-white`}
                  >
                    {g.title}
                  </div>
                  <ul className="space-y-1.5 p-2 text-[0.625rem]">
                    {g.rows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-start justify-between gap-1"
                      >
                        <span className="min-w-0 leading-snug text-[var(--portal-muted)]">
                          {row.label}
                        </span>
                        <span className="shrink-0 font-bold text-[var(--portal-title)]">
                          {row.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[0.75rem] font-bold uppercase tracking-wider text-[var(--portal-title)]">
              Feedback: Workforce Performance Metrics
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {feedbackMetrics.map((m) => (
                <article
                  key={m.label}
                  className="min-w-0 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-2"
                >
                  <div className="flex items-start gap-1.5">
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[0.625rem] font-bold text-white ${toneBg(m.tone)}`}
                    >
                      {m.icon}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[0.625rem] font-bold leading-tight ${toneClass(m.tone)}`}>
                        {m.label}
                      </p>
                      <p className={`text-[0.75rem] font-bold leading-tight ${toneClass(m.tone)}`}>
                        {m.value}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[0.5625rem] leading-snug text-[var(--portal-muted)]">
                    {m.text}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[var(--portal-primary)]" />
                <h3 className="text-sm font-bold text-[var(--portal-title)]">
                  HR Coach (Coming Soon)
                </h3>
              </div>
              <p className="mt-2 text-[0.6875rem] font-semibold text-[var(--portal-title)]">
                Ask the HR Coach
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)] px-3 py-1.5 text-[0.6875rem] font-medium text-[var(--portal-primary)]"
                >
                  Why did my score change?
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)] px-3 py-1.5 text-[0.6875rem] font-medium text-[var(--portal-primary)]"
                >
                  What should I consider next round?
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--portal-navy)]" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--portal-title)]">
                    Team Reflection
                  </h3>
                  <p className="text-[0.625rem] text-[var(--portal-muted)]">
                    100–2000 characters. Explain your HR decisions and what you
                    learned.
                  </p>
                </div>
              </div>
              <form onSubmit={handleReflectionSubmit} className="mt-2 space-y-2">
                <textarea
                  rows={2}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Our team focused on..."
                  maxLength={2000}
                  className="w-full rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-2 text-sm text-[var(--portal-ink)] placeholder:text-[var(--portal-muted)] focus:border-[var(--portal-primary)] focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.625rem] text-[var(--portal-muted)]">
                    {reflectionText.length} / 2000
                    {submittedMessage ? (
                      <span className="ml-2 font-semibold text-emerald-700">
                        {submittedMessage}
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      reflectionText.length < 100 ||
                      !brief.onSaveReflection
                    }
                    className="rounded-lg bg-[var(--portal-primary)] px-3 py-1.5 text-[0.6875rem] font-bold text-white hover:bg-[var(--portal-primary-hover)] disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Reflection"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

