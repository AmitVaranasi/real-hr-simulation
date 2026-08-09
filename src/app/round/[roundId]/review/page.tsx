"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  HeartHandshake,
  LineChart,
  Network,
  Scale,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { CompensationBreakdown } from "@/components/decisions/CompensationBreakdown";
import { DecisionStickyFooter } from "@/components/decisions/DecisionChrome";
import { DECISION_TABS } from "@/components/portal/portal-nav";
import { rowToDecision } from "@/lib/db/decisions";
import { computeBudgetBreakdown } from "@/lib/engine/budget";
import { budgetUtilizationPct } from "@/lib/engine/budget-shares";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { runSimulation } from "@/lib/engine/engine";
import { HR_TECH_ANNUAL_COST } from "@/lib/engine/programs";
import { totalHires } from "@/lib/engine/roles";
import { generateWarnings } from "@/lib/engine/validation";
import type { Decision, EconomyCondition, Industry, Strategy } from "@/lib/engine/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useSimulationConfig } from "@/hooks/useSimulationConfig";
import { markModuleVisited } from "@/lib/student/module-progress";

const TAB_ICONS = {
  recruitment: UserPlus,
  performance: Briefcase,
  training: GraduationCap,
  relations: HeartHandshake,
  compensation: Wallet,
  "org-design": Network,
  dei: Scale,
} as const;

const TAB_COLORS = {
  recruitment: "text-emerald-600 bg-emerald-50",
  performance: "text-[var(--portal-accent-blue)] bg-blue-50",
  training: "text-sky-700 bg-sky-50",
  relations: "text-[var(--portal-brand)] bg-[var(--portal-brand-soft)]",
  compensation: "text-amber-600 bg-amber-50",
  "org-design": "text-teal-600 bg-teal-50",
  dei: "text-[var(--portal-purple)] bg-violet-50",
} as const;

const DOT_COLORS = {
  recruitment: "bg-emerald-500",
  performance: "bg-[var(--portal-accent-blue)]",
  training: "bg-sky-600",
  relations: "bg-[var(--portal-brand)]",
  compensation: "bg-amber-500",
  "hr-tech": "bg-indigo-500",
  "org-design": "bg-teal-500",
  dei: "bg-[var(--portal-purple)]",
} as const;

type SummaryRow = { label: string; value: string };

function moduleSummary(d: Decision, key: string): SummaryRow[] {
  switch (key) {
    case "recruitment":
      return [
        { label: "Hiring Plan", value: `+${totalHires(d.positions_to_fill)} FTEs` },
        { label: "Screening Rigor", value: String(d.screening_rigor) },
        { label: "Diversity Sourcing Goal", value: `${d.diversity_goal_pct}%` },
        {
          label: "Onboarding",
          value: `${formatCurrency(d.onboarding_investment)}/hire`,
        },
      ];
    case "performance":
      return [
        { label: "Review Frequency", value: `${d.review_frequency}x/year` },
        { label: "360° Feedback", value: d.feedback_360 ? "Yes" : "No" },
        {
          label: "Performance Criteria",
          value: "Customized by Role",
        },
      ];
    case "training":
      return [
        {
          label: "Programs Selected",
          value: `${d.developmental_programs.length} of 6`,
        },
        { label: "Employees Trained", value: `${d.pct_employees_trained}%` },
        {
          label: "Succession Investment",
          value: formatCurrency(d.succession_investment),
        },
      ];
    case "relations":
      return [
        {
          label: "Engagement Investment",
          value: formatCurrency(d.engagement_investment),
        },
        { label: "Conflict Approach", value: d.conflict_approach },
        { label: "Flexibility Level", value: String(d.flexibility_level) },
        { label: "Voice Mechanisms", value: String(d.voice_mechanisms) },
      ];
    case "compensation":
      return [
        { label: "Benefits", value: `${d.benefits_pct}%` },
        { label: "Bonus Tier", value: `${d.bonus_tier}% of Salary` },
        { label: "Equity Level", value: String(d.equity_level) },
        { label: "HR Tech Level", value: String(d.hr_tech_level) },
      ];
    case "org-design":
      return [
        { label: "Structure Type", value: d.organizational_structure },
        { label: "Span of Control", value: String(d.span_of_control) },
        { label: "Process Focus", value: d.process_focus },
        {
          label: "Change Capability",
          value: String(d.change_management_capability),
        },
      ];
    case "dei":
      return [
        { label: "Diverse Pipelines", value: String(d.dei_diverse_recruitment) },
        { label: "Equity Practices", value: String(d.dei_equity_practices) },
        { label: "Inclusion", value: String(d.dei_inclusion_initiatives) },
        { label: "Accessibility", value: String(d.dei_accessibility_support) },
      ];
    default:
      return [];
  }
}

function moduleSpend(
  budget: ReturnType<typeof computeBudgetBreakdown>,
  key: string,
  decision: Decision
) {
  switch (key) {
    case "recruitment":
      return budget.recruitment_spend;
    case "performance":
      return budget.performance_spend;
    case "training":
      return budget.training_spend;
    case "relations":
      return budget.relations_spend;
    case "compensation":
      return budget.compensation_spend;
    case "org-design":
      return (
        budget.org_design_spend - HR_TECH_ANNUAL_COST[decision.hr_tech_level]
      );
    case "dei":
      return budget.dei_spend;
    default:
      return 0;
  }
}

const WARNING_PREVIEW = 4;

export default function ReviewPage() {
  const { ready: configReady } = useSimulationConfig();
  const { roundId } = useParams<{ roundId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [industry, setIndustry] = useState<Industry>("Manufacturing");
  const [strategy, setStrategy] = useState<Strategy>("Focus");
  const [economy, setEconomy] = useState<EconomyCondition>("normal");
  const [headcount, setHeadcount] = useState(300);
  const [collapsed, setCollapsed] = useState(false);
  const [showAllWarnings, setShowAllWarnings] = useState(false);
  const [decision, setDecision] = useState<ReturnType<typeof rowToDecision> | null>(
    null
  );

  useEffect(() => {
    async function loadDecision() {
      const res = await fetch(`/api/decisions/load?round_id=${roundId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.decision) {
          setDecision(rowToDecision(data.decision));
          setTeamId(data.team_id);
          setIndustry(data.industry);
          setStrategy(data.strategy ?? "Focus");
          setEconomy(data.economy ?? "normal");
          setHeadcount(data.headcount);
          for (const t of DECISION_TABS) {
            markModuleVisited(roundId, t.key);
          }
        }
      }
      setLoading(false);
    }
    void loadDecision();
  }, [roundId]);

  const industryConfig = useMemo(
    () => getIndustryConfig(industry),
    [industry]
  );

  const budget = useMemo(() => {
    if (!decision || !configReady) return null;
    return computeBudgetBreakdown(
      decision,
      headcount,
      industryConfig.base_market_salary,
      industryConfig
    );
  }, [decision, headcount, industryConfig, configReady]);

  const forecast = useMemo(() => {
    if (!decision || !configReady) return null;
    const prior = priorStateFromIndustry(industry);
    return runSimulation(
      decision,
      prior,
      industryConfig,
      getStrategyConfig(strategy),
      economy
    );
  }, [decision, industry, industryConfig, strategy, economy, configReady]);

  const warnings = useMemo(() => {
    if (!decision) return [];
    return generateWarnings(
      decision,
      headcount,
      industryConfig.base_market_salary,
      industryConfig,
      industry
    );
  }, [decision, headcount, industryConfig, industry]);

  async function saveNow() {
    if (!decision || !teamId) return;
    setSaving(true);
    await fetch("/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...decision,
        team_id: teamId,
        round_id: roundId,
        is_submitted: false,
      }),
    });
    setSaving(false);
  }

  async function submitFinal() {
    if (!decision || !teamId) return;
    if (!confirm("Submit final decision? Your team cannot edit after this.")) {
      return;
    }
    const res = await fetch("/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...decision,
        team_id: teamId,
        round_id: roundId,
        is_submitted: true,
      }),
    });
    if (res.ok) {
      router.push("/dashboard");
    }
  }

  if (loading || !configReady) return <p className="p-8">Loading…</p>;
  if (!decision || !budget || !forecast) {
    return (
      <p className="p-8">
        No decision found.{" "}
        <Link
          href={`/round/${roundId}/decisions`}
          className="text-[var(--portal-accent-blue)]"
        >
          Go to decisions
        </Link>
      </p>
    );
  }

  const m = forecast.hr_metrics;
  const f = forecast.financial_metrics;
  const bsc = forecast.bsc_scores;
  const util = budgetUtilizationPct(budget);
  const hrTechSpend = HR_TECH_ANNUAL_COST[decision.hr_tech_level];
  const costRows = [
    ...DECISION_TABS.filter(
      (t) => t.key !== "org-design" && t.key !== "dei"
    ).map((t) => ({
      key: t.key,
      label:
        t.key === "compensation"
          ? "Compensation (Discretionary)"
          : t.label,
      spend: moduleSpend(budget, t.key, decision),
      color: DOT_COLORS[t.key as keyof typeof DOT_COLORS],
    })),
    {
      key: "hr-tech",
      label: "HR Technology",
      spend: hrTechSpend,
      color: DOT_COLORS["hr-tech"],
    },
    {
      key: "org-design",
      label: "Org Design & Change",
      spend: moduleSpend(budget, "org-design", decision),
      color: DOT_COLORS["org-design"],
    },
    {
      key: "dei",
      label: "DEI Initiatives",
      spend: moduleSpend(budget, "dei", decision),
      color: DOT_COLORS.dei,
    },
  ].map((row) => ({
    ...row,
    pct: (row.spend / Math.max(1, budget.available_budget)) * 100,
  }));

  const visibleWarnings = showAllWarnings
    ? warnings
    : warnings.slice(0, WARNING_PREVIEW);
  const hiddenWarningCount = Math.max(0, warnings.length - WARNING_PREVIEW);

  const outcomeCards = [
    {
      label: "Turnover",
      value: formatPercent(m.turnover_rate),
      icon: Users,
    },
    {
      label: "Engagement",
      value: `${m.engagement_level.toFixed(0)}/100`,
      icon: HeartHandshake,
    },
    {
      label: "Productivity Index",
      value: formatPercent(m.productivity * 100),
      icon: LineChart,
    },
    {
      label: "Revenue",
      value: formatCurrency(f.revenue),
      icon: BarChart3,
    },
    {
      label: "Profit",
      value: formatCurrency(f.profit),
      icon: Briefcase,
    },
    {
      label: "Stock Price",
      value: `$${f.stock_price.toFixed(2)}`,
      icon: Wallet,
    },
    {
      label: "BSC Financial",
      value: `${bsc.score_financial.toFixed(1)}/25`,
      icon: BarChart3,
    },
    {
      label: "BSC Employee",
      value: `${bsc.score_employee.toFixed(1)}/25`,
      icon: Users,
    },
    {
      label: "BSC Process",
      value: `${bsc.score_process.toFixed(1)}/25`,
      icon: Network,
    },
    {
      label: "BSC Learning",
      value: `${bsc.score_learning.toFixed(1)}/25`,
      icon: GraduationCap,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1520px] pb-28">
      {/*
        Figma (1536 canvas): sidebar 244; left content ~626; gap ~27; right ~590.
        Within main content that is nearly 50/50 (slightly left-heavy).
      */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.06fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--portal-title)]">
              Review &amp; Submit
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--portal-muted)]">
              This is your final quality-control checkpoint. Review all
              decisions, budget impact, and projected outcomes before your team
              submits for this round.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--portal-brand)]/30 bg-[var(--portal-brand-soft)] px-4 py-3 text-sm text-[var(--portal-title)]">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-brand)]"
              strokeWidth={2}
            />
            <p>You can go back to any HR Decision area to make changes.</p>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Your HR Decisions
              </h2>
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--portal-accent-blue)] hover:underline"
              >
                {collapsed ? (
                  <>
                    Expand All <ChevronDown className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Collapse All <ChevronUp className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {DECISION_TABS.map((tab) => {
                const Icon = TAB_ICONS[tab.key];
                const color = TAB_COLORS[tab.key];
                const rows = moduleSummary(decision, tab.key);
                const spend = moduleSpend(budget, tab.key, decision);
                return (
                  <article
                    key={tab.key}
                    className="flex flex-col rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3.5 shadow-sm"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`rounded-lg p-2 ${color}`}>
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <h3 className="min-w-0 flex-1 text-sm font-bold leading-snug text-[var(--portal-title)]">
                        {tab.label}
                      </h3>
                    </div>

                    {!collapsed ? (
                      <dl className="mt-3 flex-1 space-y-2">
                        {rows.map((row) => (
                          <div key={row.label}>
                            <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--portal-muted)]">
                              {row.label}
                            </dt>
                            <dd className="text-[12px] font-semibold text-[var(--portal-ink)]">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <div className="flex-1" />
                    )}

                    <div className="mt-3 flex items-end justify-between gap-2 border-t border-[var(--portal-sidebar-border)] pt-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--portal-muted)]">
                          Investment
                        </p>
                        <p className="text-sm font-bold text-emerald-700">
                          {formatCurrency(spend)}
                        </p>
                      </div>
                      <Link
                        href={`/round/${roundId}/decisions?tab=${tab.key}`}
                        className="rounded-md border border-[var(--portal-accent-blue)] px-2.5 py-1 text-xs font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                      >
                        Edit
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              <span className="mr-1.5 inline-flex text-[var(--portal-accent-blue)]">
                <Wallet className="inline h-4 w-4" />
              </span>
              Compensation Economics{" "}
              <span className="font-medium normal-case tracking-normal text-[var(--portal-muted)]">
                (Estimated Annual Impact)
              </span>
            </h2>
            <div className="mt-4">
              <CompensationBreakdown
                decision={decision}
                budget={budget}
                headcount={headcount}
                marketSalary={industryConfig.base_market_salary}
                revenue={f.revenue}
              />
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-3 xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Budget Summary
            </h2>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative flex h-[82px] w-[82px] shrink-0 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-[82px] w-[82px] -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#eef1f4"
                    strokeWidth="4"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="var(--portal-success)"
                    strokeWidth="4"
                    strokeDasharray={`${Math.min(100, util)} ${100 - Math.min(100, util)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute flex flex-col items-center leading-tight">
                  <span className="text-sm font-bold text-[var(--portal-title)]">
                    {util.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-[var(--portal-muted)]">Used</span>
                </span>
              </div>
              <dl className="flex-1 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--portal-muted)]">Total HR Budget</dt>
                  <dd className="font-semibold text-[var(--portal-title)]">
                    {formatCurrency(budget.available_budget)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--portal-muted)]">Planned Spend</dt>
                  <dd className="font-semibold text-[var(--portal-brand)]">
                    {formatCurrency(budget.total_spend)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--portal-muted)]">Remaining</dt>
                  <dd
                    className={`font-semibold ${
                      budget.remaining < 0 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(budget.remaining)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--portal-muted)]">Utilization</dt>
                  <dd className="font-semibold text-[var(--portal-title)]">
                    {util.toFixed(1)}%
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 border-t border-[var(--portal-sidebar-border)] pt-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-[var(--portal-title)]">
                  Discretionary HR Budget
                </span>
                <span className="text-xs font-medium text-[var(--portal-ink)]">
                  {formatCurrency(budget.total_spend)} /{" "}
                  {formatCurrency(budget.available_budget)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eef1f4]">
                <div
                  className={`h-full rounded-full transition-all ${
                    budget.remaining < 0
                      ? "bg-red-500"
                      : "bg-[var(--portal-success)]"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(util, 2), 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[var(--portal-muted)]">
                Remaining:{" "}
                <span
                  className={
                    budget.remaining < 0
                      ? "font-semibold text-red-600"
                      : "font-semibold text-emerald-700"
                  }
                >
                  {formatCurrency(budget.remaining)}
                </span>{" "}
                | Adherence: {budget.adherence_pct.toFixed(0)}%
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Cost Breakdown{" "}
              <span className="font-medium normal-case tracking-normal text-[var(--portal-muted)]">
                (of HR Budget)
              </span>
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              {costRows.map((row) => (
                <li
                  key={row.key}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-[var(--portal-ink)]">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${row.color}`} />
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="w-12 text-right font-medium text-[var(--portal-muted)]">
                    {row.pct.toFixed(1)}%
                  </span>
                  <span className="w-[72px] text-right font-semibold text-[var(--portal-title)]">
                    {formatCurrency(row.spend)}
                  </span>
                </li>
              ))}
              <li className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-[var(--portal-sidebar-border)] pt-2 font-semibold">
                <span>Total</span>
                <span className="w-12 text-right">100%</span>
                <span className="w-[72px] text-right">
                  {formatCurrency(budget.total_spend)}
                </span>
              </li>
            </ul>
          </section>

          {warnings.length > 0 ? (
            <section className="rounded-xl border border-[var(--portal-brand)]/30 bg-[var(--portal-brand-soft)] p-4">
              <h2 className="flex items-center justify-between gap-2 text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-[var(--portal-brand)]" />
                  Warnings
                </span>
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                  {warnings.length} Issues
                </span>
              </h2>
              <ul className="mt-2 space-y-1.5 text-[12px] text-[var(--portal-title)]">
                {visibleWarnings.map((w, i) => (
                  <li key={`${w.module}-${i}`}>
                    • <strong>{w.module}:</strong> {w.message}
                  </li>
                ))}
              </ul>
              {hiddenWarningCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAllWarnings((v) => !v)}
                  className="mt-2 text-[11px] font-semibold text-[var(--portal-accent-blue)] hover:underline"
                >
                  {showAllWarnings
                    ? "Show fewer warnings"
                    : `+ ${hiddenWarningCount} more warnings`}
                </button>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Expected Outcomes{" "}
                <span className="font-medium normal-case tracking-normal text-[var(--portal-muted)]">
                  (Projected)
                </span>
              </h2>
              <Link
                href="/reports/workforce-brief"
                className="text-[11px] font-semibold text-[var(--portal-accent-blue)] hover:underline"
              >
                View Details
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {outcomeCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[#fafbfc] px-2.5 py-2"
                  >
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--portal-muted)]">
                      <Icon className="h-3 w-3 shrink-0 text-[var(--portal-accent-blue)]" />
                      <span className="truncate">{item.label}</span>
                    </p>
                    <p className="mt-1 text-sm font-bold text-[var(--portal-title)]">
                      {item.value}
                    </p>
                  </div>
                );
              })}
              <div className="col-span-2 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                  <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-600" strokeWidth={2} />
                  BSC Total (Projected)
                </p>
                <p className="mt-0.5 text-2xl font-bold text-[var(--portal-brand)]">
                  {bsc.total_score.toFixed(1)} / 100
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <DecisionStickyFooter
        saving={saving}
        continueLabel="Submit Decisions →"
        continueHint="Locks in your HR decisions for this round"
        contentMaxClassName="max-w-[1520px]"
        onSaveNow={() => void saveNow()}
        onSaveAndContinue={() => void submitFinal()}
      />
    </div>
  );
}
