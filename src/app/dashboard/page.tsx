import Link from "next/link";
import { StudentLanding } from "@/components/student/StudentLanding";
import { createClient } from "@/lib/supabase/server";
import { withSimulationConfig } from "@/lib/db/simulation-config";
import { getDiscretionaryBudget } from "@/lib/engine/simulation-config";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/admin");
  }
  if (profile?.role === "instructor") {
    redirect("/sessions");
  }

  const budgetBase = await withSimulationConfig(() =>
    getDiscretionaryBudget()
  ).catch(() => DISCRETIONARY_BUDGET);

  const { data: membership } = await supabase
    .from("team_members")
    .select(
      "team_id, teams(*, sessions(name, rounds_total, announcement, practice_rounds))"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    industry: string;
    strategy: string;
    join_code: string;
    headcount: number | null;
    revenue: number | null;
    stock_price: number | null;
    budget_carryover: number | null;
    session_id: string;
    sessions: {
      name: string;
      rounds_total: number;
      practice_rounds: number;
      announcement: string | null;
    };
  } | null;

  if (!team) {
    return (
      <div className="mx-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#e67e22]">
          Getting started
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Join your company
        </h1>
        <p className="mt-2 text-slate-600">
          Enter the join code from your instructor to unlock your team
          dashboard.
        </p>
        <Link href="/join" className="mt-8 inline-block">
          <Button size="lg">Join a team</Button>
        </Link>
        <p className="mt-4 text-sm">
          <Link
            href="/dashboard/getting-started"
            className="text-[#e67e22] hover:underline"
          >
            Or open Getting Started →
          </Link>
        </p>
      </div>
    );
  }

  const session = team.sessions;
  const roundsTotal =
    (session?.rounds_total ?? 3) + (session?.practice_rounds ?? 0);

  const { data: openRound } = await supabase
    .from("rounds")
    .select("id, round_number, round_type, status, economy_condition")
    .eq("session_id", team.session_id)
    .eq("status", "open")
    .maybeSingle();

  const { data: lastOutcome } = await supabase
    .from("outcomes")
    .select("total_score, feedback_json, computed_at")
    .eq("team_id", team.id)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: roundsCompleted } = await supabase
    .from("outcomes")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id);

  let decisionStatus: { exists: boolean; is_submitted: boolean } | null = null;
  if (openRound) {
    const { data: decision } = await supabase
      .from("decisions")
      .select("is_submitted")
      .eq("team_id", team.id)
      .eq("round_id", openRound.id)
      .maybeSingle();
    decisionStatus = decision
      ? { exists: true, is_submitted: !!decision.is_submitted }
      : { exists: false, is_submitted: false };
  }

  const lastSummary =
    lastOutcome?.feedback_json &&
    typeof lastOutcome.feedback_json === "object" &&
    "round_summary" in (lastOutcome.feedback_json as object)
      ? ((lastOutcome.feedback_json as { round_summary?: string }).round_summary ??
        null)
      : null;

  return (
    <StudentLanding
      displayName={profile?.display_name ?? "Student"}
      sessionName={session?.name ?? "Your session"}
      announcement={session?.announcement ?? null}
      team={{
        id: team.id,
        name: team.name,
        industry: team.industry,
        strategy: team.strategy,
        headcount: team.headcount,
        revenue: team.revenue != null ? Number(team.revenue) : null,
        stock_price: team.stock_price != null ? Number(team.stock_price) : null,
        budget_carryover: Number(team.budget_carryover ?? 0),
      }}
      budgetBase={budgetBase}
      roundsTotal={roundsTotal}
      roundsCompleted={roundsCompleted ?? 0}
      lastScore={
        lastOutcome?.total_score != null
          ? Number(lastOutcome.total_score)
          : null
      }
      lastSummary={lastSummary}
      initialOpenRound={
        openRound
          ? {
              id: openRound.id,
              round_number: openRound.round_number,
              round_type: openRound.round_type,
              status: openRound.status,
              economy_condition: openRound.economy_condition,
            }
          : null
      }
      initialDecision={decisionStatus}
    />
  );
}
