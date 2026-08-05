import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type StudentTeamContext = {
  userId: string;
  displayName: string;
  team: {
    id: string;
    name: string;
    industry: string | null;
    strategy: string | null;
    headcount: number | null;
    revenue: number | null;
    stock_price: number | null;
    market_share: number | null;
    profit_margin: number | null;
    join_code: string;
    session_id: string;
    sessions: {
      id: string;
      name: string;
      course_code: string | null;
      semester: string | null;
      announcement: string | null;
      instructor_id: string;
    };
  } | null;
  openRound: {
    id: string;
    round_number: number;
    status: string;
    economy_condition: string | null;
  } | null;
  instructor: {
    display_name: string;
  } | null;
  members: Array<{ display_name: string; email?: string | null }>;
};

export async function getStudentTeamContext(): Promise<StudentTeamContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("team_members")
    .select(
      "team_id, teams(*, sessions(id, name, course_code, semester, announcement, instructor_id))"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const team = (membership?.teams as unknown as StudentTeamContext["team"]) ?? null;

  let openRound: StudentTeamContext["openRound"] = null;
  let instructor: StudentTeamContext["instructor"] = null;
  let members: StudentTeamContext["members"] = [];

  if (team) {
    const { data: round } = await supabase
      .from("rounds")
      .select("id, round_number, status, economy_condition")
      .eq("session_id", team.session_id)
      .eq("status", "open")
      .maybeSingle();
    openRound = round ?? null;

    const { data: instructorProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", team.sessions.instructor_id)
      .maybeSingle();
    instructor = instructorProfile ?? null;

    const { data: memberRows } = await supabase
      .from("team_members")
      .select("user_id, profiles(display_name)")
      .eq("team_id", team.id);

    members =
      memberRows?.map((m) => {
        const p = m.profiles as unknown as { display_name: string } | null;
        return { display_name: p?.display_name ?? "Teammate" };
      }) ?? [];
  }

  return {
    userId: user.id,
    displayName: profile?.display_name ?? "Student",
    team,
    openRound,
    instructor,
    members,
  };
}
