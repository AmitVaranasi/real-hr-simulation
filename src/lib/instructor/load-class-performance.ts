import { computeBudgetBreakdown } from "@/lib/engine/budget";
import { getIndustryConfig } from "@/lib/engine/config";
import { rowToDecision } from "@/lib/engine/migrate-v1";
import type { Industry } from "@/lib/engine/types";
import type {
  ClassPerformanceBundle,
  ScoreRow,
  SpendRow,
} from "@/lib/instructor/class-performance-data";
import {
  requireInstructor,
  roundLabel,
  type CourseRound,
} from "@/lib/instructor/load-course-context";

function asIndustry(value: string): Industry | null {
  const allowed = [
    "Manufacturing",
    "Service",
    "High-Tech",
    "Banking",
    "Retail",
  ] as Industry[];
  return allowed.includes(value as Industry) ? (value as Industry) : null;
}

export async function loadClassPerformanceBundle(
  sessionId: string
): Promise<ClassPerformanceBundle> {
  const { supabase } = await requireInstructor();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, industry, strategy")
    .eq("session_id", sessionId);
  const teamList = teams ?? [];
  const teamIds = teamList.map((t) => t.id as string);

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, round_number, round_type, status, economy_condition, opened_at, closed_at")
    .eq("session_id", sessionId)
    .order("round_number", { ascending: true });

  const memberCounts = new Map<string, number>();
  if (teamIds.length > 0) {
    const { data: members } = await supabase
      .from("team_members")
      .select("team_id")
      .in("team_id", teamIds);
    for (const row of members ?? []) {
      const id = row.team_id as string;
      memberCounts.set(id, (memberCounts.get(id) ?? 0) + 1);
    }
  }

  let scores: ScoreRow[] = [];
  let spends: SpendRow[] = [];

  if (teamIds.length > 0) {
    const { data: outcomes } = await supabase
      .from("outcomes")
      .select(
        "team_id, round_id, total_score, score_financial, score_employee, score_process, score_learning, total_budget_spent"
      )
      .in("team_id", teamIds);
    scores = (outcomes ?? []).map((o) => ({
      teamId: o.team_id as string,
      roundId: o.round_id as string,
      overall: o.total_score != null ? Number(o.total_score) : null,
      financial: o.score_financial != null ? Number(o.score_financial) : null,
      employee: o.score_employee != null ? Number(o.score_employee) : null,
      process: o.score_process != null ? Number(o.score_process) : null,
      learning: o.score_learning != null ? Number(o.score_learning) : null,
      budgetSpent:
        o.total_budget_spent != null ? Number(o.total_budget_spent) : null,
    }));

    const { data: decisions } = await supabase
      .from("decisions")
      .select("*")
      .in("team_id", teamIds);

    spends = (decisions ?? []).map((row) => {
      const team = teamList.find((t) => t.id === row.team_id);
      const industry = asIndustry(String(team?.industry ?? ""));
      let areas: SpendRow["areas"] = {
        recruitment: null,
        performance: null,
        training: null,
        relations: null,
        compensation: null,
        org_design: null,
        dei: null,
      };
      let total: number | null = null;
      if (industry) {
        try {
          const decision = rowToDecision(row as Record<string, unknown>);
          const config = getIndustryConfig(industry);
          const budget = computeBudgetBreakdown(
            decision,
            config.base_headcount,
            config.base_market_salary,
            config
          );
          areas = {
            recruitment: budget.recruitment_spend,
            performance: budget.performance_spend,
            training: budget.training_spend,
            relations: budget.relations_spend,
            compensation: budget.compensation_spend,
            org_design: budget.org_design_spend,
            dei: budget.dei_spend,
          };
          total = budget.total_spend;
        } catch {
          total = null;
        }
      }
      return {
        teamId: row.team_id as string,
        roundId: row.round_id as string,
        submitted: Boolean(row.is_submitted),
        total,
        areas,
      };
    });
  }

  return {
    teams: teamList.map((t) => ({
      id: t.id as string,
      name: t.name as string,
      industry: (t.industry as string) ?? "—",
      strategy: (t.strategy as string) ?? "—",
      memberCount: memberCounts.get(t.id as string) ?? 0,
    })),
    rounds: ((rounds ?? []) as CourseRound[]).map((r) => ({
      ...r,
      label: roundLabel(r),
    })),
    scores,
    spends,
  };
}
