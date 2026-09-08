import { ManageCourseHub } from "@/components/instructor/ManageCourseHub";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ManageCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/sessions/manage");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "instructor") redirect("/dashboard");

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, name, status, course_code, semester, practice_rounds, rounds_total, teams(id), rounds(id, round_number, status)"
    )
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  const options = await Promise.all(
    (sessions ?? []).map(async (s) => {
      const teams = (s.teams as Array<{ id: string }> | null) ?? [];
      const rounds = (s.rounds ?? []) as Array<{
        id: string;
        round_number: number;
        status: string;
      }>;
      const openRound = rounds.find((r) => r.status === "open") ?? null;
      const upcoming = rounds
        .filter((r) => r.status === "pending")
        .sort((a, b) => a.round_number - b.round_number)[0];
      const latestClosed = rounds
        .filter((r) => r.status === "closed")
        .sort((a, b) => b.round_number - a.round_number)[0];
      const completedRounds = rounds.filter((r) => r.status === "closed").length;

      let submitted = 0;
      if (openRound && teams.length > 0) {
        const { data: decisions } = await supabase
          .from("decisions")
          .select("team_id, is_submitted")
          .eq("round_id", openRound.id)
          .eq("is_submitted", true);
        submitted = new Set(
          (decisions ?? []).map((d) => d.team_id).filter(Boolean)
        ).size;
      }

      return {
        id: s.id as string,
        name: s.name as string,
        status: s.status as string,
        teamCount: teams.length,
        courseCode: (s.course_code as string | null) ?? null,
        semester: (s.semester as string | null) ?? null,
        practiceRounds: Number(s.practice_rounds ?? 0),
        competitiveRounds: Number(s.rounds_total ?? 0),
        currentRoundLabel: openRound
          ? `Round ${openRound.round_number}`
          : latestClosed
            ? `Round ${latestClosed.round_number}`
            : "—",
        currentRoundHint: openRound
          ? "Decisions in Progress"
          : latestClosed
            ? "Last processed round"
            : "No round open",
        currentRoundOpen: Boolean(openRound),
        submittedValue: openRound ? `${submitted} / ${teams.length}` : "—",
        submittedHint: "Submitted",
        budgetLabel: formatCurrency(DISCRETIONARY_BUDGET),
        budgetHint: "Per team / per round",
        completedRounds,
        nextRoundLabel: upcoming ? `Round ${upcoming.round_number}` : "—",
      };
    })
  );

  const active =
    options.find((s) => s.id === sessionParam) ??
    options.find((s) => s.status === "active") ??
    options[0] ??
    null;

  return (
    <ManageCourseHub
      sessions={options}
      activeSessionId={active?.id ?? null}
    />
  );
}
