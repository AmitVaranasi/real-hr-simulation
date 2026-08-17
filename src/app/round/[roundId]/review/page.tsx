"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  HeartHandshake,
  Network,
  Scale,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompensationBreakdown } from "@/components/decisions/CompensationBreakdown";
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

/** Figma #1:77/#1:92/#1:107/#1:122/#1:137/#1:151/#1:167 — icon tint per module */
const TAB_COLORS = {
  recruitment: "text-[#078A3C]",
  performance: "text-[#1268FF]",
  training: "text-[#1268FF]",
  relations: "text-[#FF4B0B]",
  compensation: "text-[#FF4B0B]",
  "org-design": "text-[#078A3C]",
  dei: "text-[#7B2DD0]",
} as const;

/** Figma #1:233-#1:264 — cost breakdown swatches */
const DOT_COLORS = {
  recruitment: "bg-[#078A3C]",
  performance: "bg-[#1268FF]",
  training: "bg-[#7B2DD0]",
  relations: "bg-[#FF4B0B]",
  compensation: "bg-[#FF4B0B]",
  "hr-tech": "bg-[#1268FF]",
  "org-design": "bg-[#078A3C]",
  dei: "bg-[#7B2DD0]",
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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
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
    { label: "Turnover", value: formatPercent(m.turnover_rate) },
    { label: "Engagement", value: `${m.engagement_level.toFixed(0)}/100` },
    { label: "Productivity Index", value: formatPercent(m.productivity * 100) },
    { label: "Revenue", value: formatCurrency(f.revenue) },
    { label: "Profit", value: formatCurrency(f.profit) },
    { label: "Stock Price", value: `$${f.stock_price.toFixed(2)}` },
    { label: "BSC Financial", value: `${bsc.score_financial.toFixed(1)}/25` },
    { label: "BSC Employee", value: `${bsc.score_employee.toFixed(1)}/25` },
    { label: "BSC Process", value: `${bsc.score_process.toFixed(1)}/25` },
    { label: "BSC Learning", value: `${bsc.score_learning.toFixed(1)}/25` },
  ];

  return (
    <div className="mx-auto w-full pb-8">
      <div className="grid items-start gap-8 xl:grid-cols-[1.06fr_1fr]">
        <div className="min-w-0 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--portal-title)]">
              Review &amp; Submit
            </h1>
            <p className="mt-1.5 max-w-[461px] text-[11px] leading-relaxed text-[#24365A]">
              This is your final quality-control checkpoint. Review all
              decisions, budget impact, and projected outcomes before your team
              submits for this round.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-[#FFD6BD] bg-[#FFF9F3] px-4 py-2.5">
            <AlertTriangle
              className="mt-px h-4 w-4 shrink-0 text-[var(--portal-brand)]"
              strokeWidth={2}
            />
            <p className="text-[10px] leading-relaxed text-[var(--portal-brand)]">
              You can go back to any HR Decision area to make changes.
            </p>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[var(--portal-title)]">
                Your HR Decisions
              </h2>
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--portal-accent-blue)] hover:underline"
              >
                {collapsed ? (
                  <>
                    Expand All <ChevronDown className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Collapse All <ChevronUp className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {DECISION_TABS.map((tab) => {
                const Icon = TAB_ICONS[tab.key];
                const color = TAB_COLORS[tab.key];
                const allRows = moduleSummary(decision, tab.key);
                const isExpanded = expandedCards.has(tab.key);
                const rows = isExpanded ? allRows : allRows.slice(0, 3);
                const hiddenCount = allRows.length - 3;
                const spend = moduleSpend(budget, tab.key, decision);
                return (
                  <article
                    key={tab.key}
                    className="flex flex-col rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[#F7FAFD]">
                        <Icon
                          className={`h-[18px] w-[18px] ${color}`}
                          strokeWidth={1.75}
                        />
                      </div>
                      <h3 className="min-w-0 flex-1 text-[11px] font-bold leading-tight text-[var(--portal-title)]">
                        {tab.label}
                      </h3>
                    </div>

                    {!collapsed ? (
                      <dl className="mt-2.5 flex-1 space-y-1.5">
                        {rows.map((row) => (
                          <div key={row.label}>
                            <dt className="text-[9px] text-[#34466A]">
                              {row.label}
                            </dt>
                            <dd className="text-[11px] font-semibold text-[var(--portal-title)]">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                        {hiddenCount > 0 && !isExpanded ? (
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCards((prev) => {
                                  const next = new Set(prev);
                                  next.add(tab.key);
                                  return next;
                                })
                              }
                              className="text-[9px] text-[#34466A] hover:underline"
                            >
                              More ({hiddenCount})
                            </button>
                          </div>
                        ) : null}
                      </dl>
                    ) : (
                      <div className="flex-1" />
                    )}

                    <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-[var(--portal-sidebar-border)] pt-2.5">
                      <div>
                        <p className="text-[9px] text-[#34466A]">Investment</p>
                        <p className="text-xs font-bold text-[var(--portal-success)]">
                          {formatCurrency(spend)}
                        </p>
                      </div>
                      <Link
                        href={`/round/${roundId}/decisions?tab=${tab.key}`}
                        className="inline-flex h-[23px] items-center rounded-md border border-[var(--portal-accent-blue)] px-2.5 text-[9px] font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
                      >
                        Edit
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <CompensationBreakdown
            decision={decision}
            budget={budget}
            headcount={headcount}
            marketSalary={industryConfig.base_market_salary}
            revenue={f.revenue}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[13px] font-bold text-[var(--portal-title)]">
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
                  <span className="text-[0.625rem] text-[var(--portal-muted)]">Used</span>
                </span>
              </div>
              <dl className="flex-1 space-y-1.5 text-[11px]">
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
              <div className="h-2 overflow-hidden rounded-full bg-[#D9DEE7]">
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
              <p className="mt-2 text-[0.6875rem] text-[var(--portal-muted)]">
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
            <h2 className="text-xs font-bold text-[var(--portal-title)]">
              Cost Breakdown{" "}
              <span className="text-[9px] font-normal text-[#34466A]">
                (of HR Budget)
              </span>
            </h2>
            <ul className="mt-3 space-y-1.5 text-[10px]">
              {costRows.map((row) => (
                <li
                  key={row.key}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-[var(--portal-title)]">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-[2px] ${row.color}`}
                    />
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="w-12 text-right text-[var(--portal-title)]">
                    {row.pct.toFixed(1)}%
                  </span>
                  <span className="w-[72px] text-right text-[var(--portal-title)]">
                    {formatCurrency(row.spend)}
                  </span>
                </li>
              ))}
              <li className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-[var(--portal-sidebar-border)] pt-2 text-[11px] font-bold text-[var(--portal-title)]">
                <span>Total</span>
                <span className="w-12 text-right">100%</span>
                <span className="w-[72px] text-right">
                  {formatCurrency(budget.total_spend)}
                </span>
              </li>
            </ul>
          </section>

          {warnings.length > 0 ? (
            <section className="rounded-xl border border-[#FFD6BD] bg-[#FFF9F3] p-4">
              <h2 className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--portal-brand)]">
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Warnings
                </span>
                <span className="text-[10px] font-bold">
                  {warnings.length} Issues
                </span>
              </h2>
              <ul className="mt-2 space-y-1.5 text-[10px] leading-snug text-[var(--portal-title)]">
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
                  className="mt-2 text-[10px] font-bold text-[var(--portal-brand)] hover:underline"
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
              <h2 className="text-xs font-bold text-[var(--portal-title)]">
                Expected Outcomes{" "}
                <span className="text-[9px] font-normal text-[#34466A]">
                  (Projected)
                </span>
              </h2>
              <Link
                href="/reports/workforce-brief"
                className="text-[10px] font-semibold text-[var(--portal-accent-blue)] hover:underline"
              >
                View Details
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {outcomeCards.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#E5EAF2] bg-white px-2.5 py-2"
                >
                  <p className="truncate text-[9px] text-[#34466A]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[13px] font-bold text-[var(--portal-title)]">
                    {item.value}
                  </p>
                </div>
              ))}
              <div className="col-span-2 flex items-center gap-2.5 rounded-xl border border-[#F1D59D] bg-[#FFF9EA] px-3 py-2">
                <span className="text-2xl leading-none">🏆</span>
                <div>
                  <p className="text-[10px] font-bold text-[var(--portal-title)]">
                    BSC Total (Projected)
                  </p>
                  <p className="text-[23px] font-bold leading-tight text-[var(--portal-brand)]">
                    {bsc.total_score.toFixed(1)} / 100
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Figma #1:318-#1:322 — save / submit bar */}
          <div className="flex items-stretch gap-3">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => void saveNow()}
              className="h-11 w-24 shrink-0 rounded-lg border-[var(--portal-accent-blue)] text-[10px] font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
            >
              Save Now
            </Button>
            <Button
              variant="orange"
              disabled={saving}
              onClick={() => void submitFinal()}
              className="h-[46px] flex-1 flex-col gap-0 rounded-lg py-1.5"
            >
              <span className="text-sm font-bold leading-tight">
                Submit Decisions
              </span>
              <span className="text-[9px] font-normal leading-tight opacity-90">
                Locks in your HR decisions for this round
              </span>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
