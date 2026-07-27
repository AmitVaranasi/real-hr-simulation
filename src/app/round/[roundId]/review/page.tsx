"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BudgetTracker } from "@/components/dashboard/BudgetTracker";
import { CompensationBreakdown } from "@/components/decisions/CompensationBreakdown";
import { Button } from "@/components/ui/button";
import { rowToDecision } from "@/lib/db/decisions";
import { computeBudgetBreakdown } from "@/lib/engine/budget";
import { budgetUtilizationPct } from "@/lib/engine/budget-shares";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { runSimulation } from "@/lib/engine/engine";
import { generateWarnings } from "@/lib/engine/validation";
import type { EconomyCondition, Industry, Strategy } from "@/lib/engine/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useSimulationConfig } from "@/hooks/useSimulationConfig";

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

  const criticalWarnings = warnings.filter(
    (w) => w.severity === "critical" || w.severity === "warning"
  );
  const recommendations = warnings.filter((w) => w.severity === "info");

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

  const modules = [
    ["Recruitment", budget.recruitment_spend],
    ["Performance", budget.performance_spend],
    ["Training", budget.training_spend],
    ["Employee relations", budget.relations_spend],
    ["Compensation (discretionary)", budget.compensation_spend],
    ["HR technology", budget.org_design_spend],
  ];

  const m = forecast.hr_metrics;
  const f = forecast.financial_metrics;
  const bsc = forecast.bsc_scores;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/round/${roundId}/decisions`}
        className="text-sm text-[#e67e22] hover:underline"
      >
        ← Back to edit
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Review & submit</h1>
      <p className="mt-1 text-sm text-slate-500">
        Final quality-control checkpoint. Review budget, projected consequences,
        and warnings before your team submits.
      </p>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Budget summary</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <dt className="text-slate-500">Total HR budget</dt>
          <dd className="font-medium">{formatCurrency(budget.available_budget)}</dd>
          <dt className="text-slate-500">Planned spend</dt>
          <dd className="font-medium">{formatCurrency(budget.total_spend)}</dd>
          <dt className="text-slate-500">Remaining</dt>
          <dd
            className={`font-medium ${budget.remaining < 0 ? "text-red-600" : "text-emerald-700"}`}
          >
            {formatCurrency(budget.remaining)}
          </dd>
          <dt className="text-slate-500">Utilization</dt>
          <dd className="font-medium">
            {formatPercent(budgetUtilizationPct(budget))}
          </dd>
        </dl>
        <div className="mt-4">
          <BudgetTracker budget={budget} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Cost breakdown</h2>
        <ul className="mt-3 space-y-2">
          {modules.map(([name, spend]) => (
            <li
              key={String(name)}
              className="flex justify-between rounded-lg border bg-white px-4 py-2 text-sm"
            >
              <span>{name}</span>
              <span className="font-medium">{formatCurrency(Number(spend))}</span>
            </li>
          ))}
        </ul>
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

      {criticalWarnings.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold text-slate-900">Warnings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Unrealistic or high-risk allocations relative to industry norms.
          </p>
          <ul className="mt-2 space-y-2">
            {criticalWarnings.map((w, i) => (
              <li
                key={i}
                className={`rounded-lg px-3 py-2 text-sm ${
                  w.severity === "critical"
                    ? "bg-red-50 text-red-800"
                    : "bg-amber-50 text-amber-900"
                }`}
              >
                <strong>{w.module}:</strong> {w.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold text-slate-900">Recommendations</h2>
          <p className="mt-1 text-sm text-slate-500">
            Coaching notes — educational guidance, not hard blocks.
          </p>
          <ul className="mt-2 space-y-2">
            {recommendations.map((w, i) => (
              <li
                key={i}
                className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900"
              >
                <strong>{w.module}:</strong> {w.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-[#f5d0a9] bg-[#fff4e8]/60 p-5">
        <h2 className="font-semibold text-[#9a3412]">
          Expected consequences
        </h2>
        <p className="mt-1 text-sm text-[#9a3412]/80">
          Preview using the same engine as round scoring. Actual results depend
          on economy, carry-forward state, and final compute.
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
          <dt>BSC Financial</dt>
          <dd className="font-medium">{bsc.score_financial.toFixed(1)}</dd>
          <dt>BSC Employee</dt>
          <dd className="font-medium">{bsc.score_employee.toFixed(1)}</dd>
          <dt>BSC Process</dt>
          <dd className="font-medium">{bsc.score_process.toFixed(1)}</dd>
          <dt>BSC Learning</dt>
          <dd className="font-medium">{bsc.score_learning.toFixed(1)}</dd>
          <dt className="font-semibold text-[#9a3412]">BSC total (projected)</dt>
          <dd className="font-semibold text-[#c45f12]">
            {bsc.total_score.toFixed(1)} / 100
          </dd>
        </dl>
      </section>

      <div className="mt-8 flex gap-3">
        <Button onClick={submitFinal}>Submit decision</Button>
        <Link href={`/round/${roundId}/decisions`}>
          <Button variant="outline">Back to edit</Button>
        </Link>
      </div>
    </div>
  );
}
