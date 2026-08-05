"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BudgetTracker } from "@/components/dashboard/BudgetTracker";
import { CompensationBreakdown } from "@/components/decisions/CompensationBreakdown";
import { Button } from "@/components/ui/button";
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
import { totalHires } from "@/lib/engine/roles";
import { generateWarnings } from "@/lib/engine/validation";
import type { Decision, EconomyCondition, Industry, Strategy } from "@/lib/engine/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useSimulationConfig } from "@/hooks/useSimulationConfig";
import { StudentPageHeader } from "@/components/student/shell/StudentShell";

function moduleSummary(d: Decision, key: string): string[] {
  switch (key) {
    case "recruitment":
      return [
        `Total New Hires: ${totalHires(d.positions_to_fill)}`,
        `Screening Rigor: ${d.screening_rigor}`,
        `Diversity Sourcing Goal: ${d.diversity_goal_pct}%`,
        `Onboarding Investment: ${formatCurrency(d.onboarding_investment)}/hire`,
      ];
    case "performance":
      return [
        `Review Frequency: ${d.review_frequency}x/year`,
        `360° Feedback: ${d.feedback_360 ? "Yes" : "No"}`,
        `Role KPI targets set: ${d.role_performance.length}`,
      ];
    case "training":
      return [
        `Programs: ${d.developmental_programs.join(", ") || "—"}`,
        `Employees Trained: ${d.pct_employees_trained}%`,
        `Succession Investment: ${formatCurrency(d.succession_investment)}`,
      ];
    case "relations":
      return [
        `Engagement Investment: ${formatCurrency(d.engagement_investment)}`,
        `Conflict Approach: ${d.conflict_approach}`,
        `Flexibility Level: ${d.flexibility_level}`,
        `Voice Mechanisms: ${d.voice_mechanisms}`,
      ];
    case "compensation":
      return [
        `Benefits: ${d.benefits_pct}%`,
        `Bonus Tier: ${d.bonus_tier}%`,
        `Equity Level: ${d.equity_level}`,
        `HR Tech Level: ${d.hr_tech_level}`,
      ];
    case "org-design":
      return [
        `Structure: ${d.organizational_structure}`,
        `Span of Control: ${d.span_of_control}`,
        `Process Focus: ${d.process_focus}`,
        `Change Capability: ${d.change_management_capability}`,
        `Collaboration: ${d.collaboration_enablement}`,
      ];
    case "dei":
      return [
        `Diverse Pipelines: ${d.dei_diverse_recruitment}`,
        `Equity Practices: ${d.dei_equity_practices}`,
        `Inclusion: ${d.dei_inclusion_initiatives}`,
        `Training & Education: ${d.dei_training_education}`,
        `Accessibility: ${d.dei_accessibility_support}`,
      ];
    default:
      return [];
  }
}

function moduleSpend(budget: ReturnType<typeof computeBudgetBreakdown>, key: string) {
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
      return budget.org_design_spend;
    case "dei":
      return budget.dei_spend;
    default:
      return 0;
  }
}

export default function ReviewPage() {
  const { ready: configReady } = useSimulationConfig();
  const { roundId } = useParams<{ roundId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState("");
  const [industry, setIndustry] = useState<Industry>("Manufacturing");
  const [strategy, setStrategy] = useState<Strategy>("Focus");
  const [economy, setEconomy] = useState<EconomyCondition>("normal");
  const [headcount, setHeadcount] = useState(300);
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
        <Link href={`/round/${roundId}/decisions`} className="text-[#e67e22]">
          Go to decisions
        </Link>
      </p>
    );
  }

  const m = forecast.hr_metrics;
  const f = forecast.financial_metrics;
  const bsc = forecast.bsc_scores;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <StudentPageHeader
        title="Review & Submit"
        subtitle="This is your final quality-control checkpoint. Review all decisions, budget impact, and projected outcomes before your team submits for this round."
      />

      <div className="rounded-lg border border-[#f5d0a9] bg-[#fff4e8] px-4 py-3 text-sm text-[#9a3412]">
        You can go back to any HR Decision area to make changes. Only Submit
        Decisions locks the round.
      </div>

      <section>
        <h2 className="text-lg font-semibold text-[#0f172a]">Your HR Decisions</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {DECISION_TABS.map((tab) => (
            <article
              key={tab.key}
              className="rounded-xl border border-[#dde1e6] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-[#0f172a]">{tab.label}</h3>
                <Link
                  href={`/round/${roundId}/decisions?tab=${tab.key}`}
                  className="text-xs font-semibold text-[#e67e22] hover:underline"
                >
                  Edit
                </Link>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-[#6b7280]">
                {moduleSummary(decision, tab.key).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium text-[#1f2937]">
                Investment: {formatCurrency(moduleSpend(budget, tab.key))}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-[#0f172a]">Budget summary</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <dt className="text-[#6b7280]">Total HR budget</dt>
          <dd className="font-medium">{formatCurrency(budget.available_budget)}</dd>
          <dt className="text-[#6b7280]">Planned spend</dt>
          <dd className="font-medium">{formatCurrency(budget.total_spend)}</dd>
          <dt className="text-[#6b7280]">Remaining</dt>
          <dd
            className={`font-medium ${budget.remaining < 0 ? "text-red-600" : "text-emerald-700"}`}
          >
            {formatCurrency(budget.remaining)}
          </dd>
          <dt className="text-[#6b7280]">Utilization</dt>
          <dd className="font-medium">
            {formatPercent(budgetUtilizationPct(budget))}
          </dd>
        </dl>
        <div className="mt-4">
          <BudgetTracker budget={budget} />
        </div>
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

      {warnings.length > 0 && (
        <section className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#0f172a]">Warnings & coaching notes</h2>
          <ul className="mt-3 space-y-2">
            {warnings.map((w, i) => (
              <li
                key={i}
                className={`rounded-lg px-3 py-2 text-sm ${
                  w.severity === "critical"
                    ? "bg-red-50 text-red-800"
                    : w.severity === "warning"
                      ? "bg-amber-50 text-amber-900"
                      : "bg-sky-50 text-sky-900"
                }`}
              >
                <strong>{w.module}:</strong> {w.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-[#f5d0a9] bg-[#fff4e8]/60 p-5">
        <h2 className="font-semibold text-[#9a3412]">Projected outcomes</h2>
        <p className="mt-1 text-sm text-[#9a3412]/80">
          Preview using the existing simulation engine. Actual results depend on
          economy, carry-forward state, and final compute.
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <dt>Turnover (projected)</dt>
          <dd className="font-medium">{formatPercent(m.turnover_rate)}</dd>
          <dt>Engagement</dt>
          <dd className="font-medium">{m.engagement_level.toFixed(0)}/100</dd>
          <dt>Productivity index</dt>
          <dd className="font-medium">{formatPercent(m.productivity * 100)}</dd>
          <dt>Revenue (projected)</dt>
          <dd className="font-medium">{formatCurrency(f.revenue)}</dd>
          <dt>Profit (projected)</dt>
          <dd className="font-medium">{formatCurrency(f.profit)}</dd>
          <dt>Stock price (projected)</dt>
          <dd className="font-medium">${f.stock_price.toFixed(2)}</dd>
          <dt className="font-semibold text-[#9a3412]">HR Balance Scorecard (projected)</dt>
          <dd className="font-semibold text-[#c45f12]">
            {bsc.total_score.toFixed(1)} / 100
          </dd>
        </dl>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button onClick={submitFinal}>Submit Decisions</Button>
        <Link href={`/round/${roundId}/decisions`}>
          <Button variant="outline">Back to HR Decisions</Button>
        </Link>
      </div>
    </div>
  );
}
