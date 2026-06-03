"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BudgetTracker } from "@/components/dashboard/BudgetTracker";
import { Button } from "@/components/ui/button";
import { rowToDecision } from "@/lib/db/decisions";
import { computeBudgetBreakdown } from "@/lib/engine/budget";
import { getIndustryConfig, priorStateFromIndustry } from "@/lib/engine/config";
import type { Industry } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils";

export default function ReviewPage() {
  const { roundId } = useParams<{ roundId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState("");
  const [industry, setIndustry] = useState<Industry>("Manufacturing");
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
          setHeadcount(data.headcount);
        }
      }
      setLoading(false);
    }
    void loadDecision();
  }, [roundId]);

  const budget = useMemo(() => {
    if (!decision) return null;
    const config = getIndustryConfig(industry);
    return computeBudgetBreakdown(
      decision,
      headcount,
      config.base_market_salary,
      config
    );
  }, [decision, industry, headcount]);

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
  if (!decision || !budget) {
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
    ["Relations", budget.relations_spend],
    ["Compensation", budget.compensation_spend],
    ["Org Design", budget.org_design_spend],
    ["DEI", budget.dei_spend],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/round/${roundId}/decisions`}
        className="text-sm text-indigo-600 hover:underline"
      >
        ← Back to edit
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Review & submit</h1>
      <div className="mt-6">
        <BudgetTracker budget={budget} />
      </div>
      <ul className="mt-6 space-y-2">
        {modules.map(([name, spend]) => (
          <li
            key={String(name)}
            className="flex justify-between rounded-lg border bg-white px-4 py-2 text-sm"
          >
            <span>{name}</span>
            <span className="font-medium">{formatCurrency(Number(spend))}</span>
          </li>
        ))}
        <li className="flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span>{formatCurrency(budget.total_spend)}</span>
        </li>
      </ul>
      <div className="mt-8 flex gap-3">
        <Button onClick={submitFinal}>Submit decision</Button>
        <Link href={`/round/${roundId}/decisions`}>
          <Button variant="outline">Back to edit</Button>
        </Link>
      </div>
    </div>
  );
}
