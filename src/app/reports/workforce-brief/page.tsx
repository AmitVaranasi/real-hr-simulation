import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkforceBriefClient } from "@/components/results/WorkforceBriefClient";
import type { WorkforceBriefData } from "@/components/results/WorkforceBriefView";
import { getStrategyConfig } from "@/lib/engine/config";
import type { Strategy } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

function formatRoundDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function mapOutcomeToBrief(
  team: {
    name: string;
    industry: string;
    strategy: string;
    headcount?: number;
  },
  outcome: Record<string, unknown> | null,
  round: { round_number: number; status: string } | null
): Partial<WorkforceBriefData> {
  const strategyConfig = getStrategyConfig(
    (team.strategy || "Focus") as Strategy
  );
  const weights = strategyConfig.bsc_weights;

  return {
    teamName: team.name || "Crazy Managers",
    industry: team.industry || "Manufacturing",
    strategy: team.strategy || "Focus",
    roundNumber: round?.round_number ?? 1,
    roundStatus: round?.status ? String(round.status) : "Open",

    totalScore: Number(
      outcome?.instructor_override ?? outcome?.total_score ?? 52.3
    ),
    scoreFinancial: Number(outcome?.score_financial ?? 10.4),
    scoreEmployee: Number(outcome?.score_employee ?? 20.3),
    scoreProcess: Number(outcome?.score_process ?? 17.2),
    scoreLearning: Number(outcome?.score_learning ?? 4.5),
    maxFinancial: weights.financial,
    maxEmployee: weights.employee,
    maxProcess: weights.process,
    maxLearning: weights.learning,

    revenue: Number(outcome?.revenue ?? 50_117_000),
    profit: Number(outcome?.profit ?? -11_227_430),
    stockPrice: Number(outcome?.stock_price ?? 22.335),
    marketShare: Number(outcome?.market_share ?? 15.5),
    profitMargin: Number(outcome?.profit_margin ?? -22.4),
    headcount: Number(outcome?.headcount ?? team.headcount ?? 281),
    requiredHeadcount: 420,

    turnoverRate: Number(outcome?.turnover_rate ?? 11.68),
    averageSalary:
      Number(outcome?.total_compensation ?? 0) /
        Math.max(1, Number(outcome?.headcount ?? 1)) || 68_450,
    compensationRatio: Number(outcome?.compensation_ratio ?? 34.06),
    satisfaction: Number(outcome?.employee_satisfaction ?? 75.7),
    engagement: Number(outcome?.engagement_level ?? 71.3),
    costPerHire: Number(outcome?.cost_per_hire ?? 4143),
    timeToFill: Number(outcome?.time_to_fill ?? 35.1),
    hiringQuality: Number(outcome?.hiring_quality ?? 0),
    turnoverCost: Number(outcome?.turnover_cost ?? 0),
    absenteeismRate: Number(outcome?.absenteeism_rate ?? 5.28),
    trainingRoi: Number(outcome?.training_roi ?? 0),
    trainingEffectiveness: Number(outcome?.training_effectiveness ?? 0.03),
    successionPipeline: Number(outcome?.succession_pipeline ?? 35.01),
    reviewCoverage: Number(outcome?.review_coverage ?? 86),
    productivityIndex: Number(outcome?.productivity ?? 0),
    budgetAdherence: Number(outcome?.budget_adherence ?? 0),
    deiScore: Number(outcome?.dei_score ?? 19.5),
    hrTechScore: Number(outcome?.hr_tech_score ?? 20),
  };
}

export default async function WorkforceBriefIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/reports/workforce-brief");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select(
      "team_id, teams(id, name, industry, strategy, headcount, session_id, sessions(name))"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    industry: string;
    strategy: string;
    headcount: number;
    session_id: string;
    sessions: { name: string } | null;
  } | null;

  if (!team) {
    return (
      <div className="p-4 sm:p-6">
        <WorkforceBriefClient data={{}} />
      </div>
    );
  }

  const { data: outcomes } = await supabase
    .from("outcomes")
    .select("*, rounds(id, round_number, status, closed_at)")
    .eq("team_id", team.id)
    .order("computed_at", { ascending: false });

  const latest = outcomes?.[0] ?? null;
  const round = latest?.rounds as unknown as {
    id: string;
    round_number: number;
    status: string;
    closed_at: string | null;
  } | null;

  const rounds: WorkforceBriefData["rounds"] = (outcomes ?? []).map((o) => {
    const r = o.rounds as unknown as {
      id: string;
      round_number: number;
      closed_at: string | null;
    } | null;
    return {
      id: o.id as string,
      roundId: (o.round_id as string) ?? r?.id ?? "",
      roundNumber: r?.round_number ?? 0,
      dateLabel: formatRoundDate(
        r?.closed_at ?? (o.computed_at as string | undefined)
      ),
      href: `/round/${o.round_id}/results`,
    };
  });

  let reflectionContent: string | null = null;
  if (latest?.round_id) {
    const { data: reflection } = await supabase
      .from("reflections")
      .select("content")
      .eq("team_id", team.id)
      .eq("round_id", latest.round_id)
      .maybeSingle();
    reflectionContent = reflection?.content ?? null;
  }

  const briefData: Partial<WorkforceBriefData> = {
    ...mapOutcomeToBrief(team, latest, round),
    rounds,
    selectedRoundId: (latest?.round_id as string | undefined) ?? null,
    reflectionContent,
  };

  return (
    <div className="p-4 sm:p-6">
      <WorkforceBriefClient
        data={briefData}
        teamId={team.id}
        roundId={(latest?.round_id as string | undefined) ?? undefined}
        sessionName={team.sessions?.name ?? "Session"}
        team={{
          name: team.name,
          industry: team.industry,
          strategy: team.strategy,
        }}
        outcome={latest}
      />
    </div>
  );
}
