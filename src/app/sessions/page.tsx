import { ProfessorDashboard } from "@/components/instructor/ProfessorDashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "instructor") redirect("/dashboard");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, rounds(*), teams(id)")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  const summaries = await Promise.all(
    (sessions ?? []).map(async (s) => {
      const rounds = ((s.rounds ?? []) as Array<{
        id: string;
        round_number: number;
        round_type: string;
        status: string;
      }>).map((r) => ({
        id: r.id,
        round_number: r.round_number,
        round_type: r.round_type,
        status: r.status,
      }));
      const teams = (s.teams ?? []) as Array<{ id: string }>;
      const openRound = rounds.find((r) => r.status === "open") ?? null;
      const closed = rounds.filter((r) => r.status === "closed");
      const latestClosed = closed.sort(
        (a, b) => b.round_number - a.round_number
      )[0];

      let submittedCount = 0;
      if (openRound && teams.length > 0) {
        const { count } = await supabase
          .from("decisions")
          .select("id", { count: "exact", head: true })
          .eq("round_id", openRound.id)
          .eq("is_submitted", true);
        submittedCount = count ?? 0;
      }

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
      };
    })
  );

  return <ProfessorDashboard sessions={summaries} />;
}
