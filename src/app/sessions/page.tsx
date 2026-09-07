import { ProfessorDashboard } from "@/components/instructor/ProfessorDashboard";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function uniqueOrMixed(values: Array<string | null | undefined>) {
  const set = [...new Set(values.filter((v): v is string => Boolean(v)))];
  if (set.length === 0) return "—";
  if (set.length === 1) return set[0];
  return "Multiple";
}

function avg(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "instructor") redirect("/dashboard");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, rounds(*), teams(id, name, industry, strategy)")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  const summaries = await Promise.all(
    (sessions ?? []).map(async (s) => {
      const rounds = ((s.rounds ?? []) as Array<{
        id: string;
        round_number: number;
        round_type: string;
        status: string;
        economy_condition?: string | null;
      }>).map((r) => ({
        id: r.id,
        round_number: r.round_number,
        round_type: r.round_type,
        status: r.status,
        economy_condition: r.economy_condition ?? null,
      }));
      const teams = (s.teams ?? []) as Array<{
        id: string;
        name: string;
        industry: string | null;
        strategy: string | null;
      }>;
      const openRound = rounds.find((r) => r.status === "open") ?? null;
      const closed = rounds.filter((r) => r.status === "closed");
      const latestClosed = closed.sort(
        (a, b) => b.round_number - a.round_number
      )[0];

      let submittedCount = 0;
      let startedCount = 0;
      const lastScores = new Map<string, number>();

      if (openRound && teams.length > 0) {
        const { data: decisions } = await supabase
          .from("decisions")
          .select("team_id, is_submitted")
          .eq("round_id", openRound.id);
        const started = new Set<string>();
        const submitted = new Set<string>();
        for (const row of decisions ?? []) {
          if (row.team_id) started.add(row.team_id as string);
          if (row.is_submitted) submitted.add(row.team_id as string);
        }
        startedCount = started.size;
        submittedCount = submitted.size;
      }

      let snapshot = null;
      if (latestClosed) {
        const { data: outcomes } = await supabase
          .from("outcomes")
          .select(
            "team_id, headcount, revenue, profit, stock_price, total_score, total_budget_spent"
          )
          .eq("round_id", latestClosed.id);
        for (const row of outcomes ?? []) {
          if (row.team_id && row.total_score != null) {
            lastScores.set(row.team_id as string, Number(row.total_score));
          }
        }
        if (outcomes && outcomes.length > 0) {
          snapshot = {
            headcount: avg(outcomes.map((o) => (o.headcount != null ? Number(o.headcount) : null))),
            revenue: avg(outcomes.map((o) => (o.revenue != null ? Number(o.revenue) : null))),
            profit: avg(outcomes.map((o) => (o.profit != null ? Number(o.profit) : null))),
            stockPrice: avg(
              outcomes.map((o) => (o.stock_price != null ? Number(o.stock_price) : null))
            ),
            bsc: avg(outcomes.map((o) => (o.total_score != null ? Number(o.total_score) : null))),
            budgetRemaining: avg(
              outcomes.map((o) =>
                o.total_budget_spent != null
                  ? DISCRETIONARY_BUDGET - Number(o.total_budget_spent)
                  : null
              )
            ),
          };
        }
      }

      const saved = Math.max(0, startedCount - submittedCount);
      const awaiting = Math.max(0, teams.length - submittedCount);

      return {
        id: s.id as string,
        name: s.name as string,
        course_code: (s.course_code as string | null) ?? null,
        semester: (s.semester as string | null) ?? null,
        status: s.status as string,
        rounds_total: Number(s.rounds_total ?? 3),
        practice_rounds: Number(s.practice_rounds ?? 1),
        teamCount: teams.length,
        openRound,
        rounds,
        currentRoundLabel: openRound
          ? `Round ${openRound.round_number} open`
          : latestClosed
            ? `Round ${latestClosed.round_number} closed`
            : "No rounds started",
        submittedCount,
        decisionsExpected: openRound ? teams.length : 0,
        industry: uniqueOrMixed(teams.map((t) => t.industry)),
        strategy: uniqueOrMixed(teams.map((t) => t.strategy)),
        economy: openRound?.economy_condition
          ? openRound.economy_condition.charAt(0).toUpperCase() +
            openRound.economy_condition.slice(1)
          : "—",
        budget: DISCRETIONARY_BUDGET,
        progress: {
          total: teams.length,
          started: startedCount,
          saved,
          submitted: submittedCount,
          awaiting,
        },
        snapshot,
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          industry: t.industry,
          strategy: t.strategy,
          lastScore: lastScores.get(t.id) ?? null,
        })),
        completedRounds: closed.length,
      };
    })
  );

  return (
    <ProfessorDashboard
      sessions={summaries}
      professorName={profile?.display_name ?? "Professor"}
    />
  );
}
