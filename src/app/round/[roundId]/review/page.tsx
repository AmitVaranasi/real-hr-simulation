"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BudgetTracker } from "@/components/dashboard/BudgetTracker";
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

export default function ReviewPage() {
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
    if (!decision) return null;
    return computeBudgetBreakdown(
      decision,
      headcount,
      industryConfig.base_market_salary,
      industryConfig
    );
  }, [decision, headcount, industryConfig]);

  const forecast = useMemo(() => {
    if (!decision) return null;
    const prior = priorStateFromIndustry(industry);
    return runSimulation(
      decision,
      prior,
      industryConfig,
      getStrategyConfig(strategy),
      economy
    );
  }, [decision, industry, industryConfig, strategy, economy]);

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

  if (loading) return <p className="p-8">Loading…</p>;
  if (!decision || !budget || !forecast) {
    return (
      <p className="p-8">
        No decision found.{" "}
        <Link href={`/round/${roundId}/decisions`} className="text-indigo-600">
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/round/${roundId}/decisions`}
        className="text-sm text-indigo-600 hover:underline"
      >
        ← Back to edit
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Review & submit</h1>
      <p className="mt-1 text-sm text-slate-500">
        Projected outcomes below use the same engine as round scoring (preview only).
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
      </section>

      {warnings.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold text-slate-900">Recommendations</h2>
          <ul className="mt-2 space-y-2">
            {warnings.map((w, i) => (
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

      <section className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
        <h2 className="font-semibold text-indigo-900">Metric forecasts</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <dt>Turnover (projected)</dt>
          <dd className="font-medium">{formatPercent(m.turnover_rate)}</dd>
          <dt>Engagement</dt>
          <dd className="font-medium">{m.engagement_level.toFixed(0)}/100</dd>
          <dt>Productivity index</dt>
          <dd className="font-medium">{formatPercent(m.productivity * 100)}</dd>
          <dt>Profit (projected)</dt>
          <dd className="font-medium">{formatCurrency(f.profit)}</dd>
          <dt>BSC score (projected)</dt>
          <dd className="font-semibold text-indigo-700">
            {forecast.bsc_scores.total_score.toFixed(1)} / 100
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
