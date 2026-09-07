import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { CourseRailState } from "@/components/instructor/ProfessorChrome";

export type CourseRound = {
  id: string;
  round_number: number;
  round_type: string;
  status: string;
  economy_condition?: string | null;
  opened_at?: string | null;
  closed_at?: string | null;
};

export type ActiveCourse = {
  sessionId: string;
  name: string;
  courseCode: string | null;
  semester: string | null;
  status: string;
  announcement: string | null;
  practiceRounds: number;
  competitiveRounds: number;
  practiceOpen: boolean;
  studentsEnrolled: number;
  teamsCreated: number;
  roundsCompleted: number;
  nextRoundLabel: string | null;
  currentRoundLabel: string | null;
  openRound: CourseRound | null;
  latestClosed: CourseRound | null;
  resultsAvailable: boolean;
  teamIds: string[];
  rounds: CourseRound[];
};

export function courseRail(course: ActiveCourse | null): CourseRailState {
  if (!course) return {};
  return {
    sessionId: course.sessionId,
    practiceOpen: course.practiceOpen,
    competitiveRounds: course.competitiveRounds,
    studentsEnrolled: course.studentsEnrolled,
    teamsCreated: course.teamsCreated,
    roundsCompleted: course.roundsCompleted,
    nextRoundLabel: course.nextRoundLabel,
  };
}

export function roundLabel(round: CourseRound | null | undefined) {
  if (!round) return "—";
  const kind = round.round_type === "practice" ? "Practice" : "Competitive";
  return `${kind} Round ${round.round_number}`;
}

export async function requireInstructor(next = "/sessions") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${next}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "instructor" && profile?.role !== "admin") {
    redirect("/dashboard");
  }
  return { supabase, user };
}

export async function loadActiveCourse(
  preferredSessionId?: string | null
): Promise<ActiveCourse | null> {
  const { supabase, user } = await requireInstructor();

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, name, status, course_code, semester, announcement, practice_rounds, rounds_total, teams(id), rounds(id, round_number, round_type, status, economy_condition, opened_at, closed_at)"
    )
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });
  const list = sessions ?? [];
  const selected =
    list.find((s) => s.id === preferredSessionId) ??
    list.find((s) => s.status === "active") ??
    list[0] ??
    null;
  if (!selected) return null;

  const teams = (selected.teams ?? []) as Array<{ id: string }>;
  const rounds = ((selected.rounds ?? []) as CourseRound[]).slice().sort(
    (a, b) => a.round_number - b.round_number
  );
  const openRound = rounds.find((r) => r.status === "open") ?? null;
  const latestClosed =
    rounds
      .filter((r) => r.status === "closed")
      .sort((a, b) => b.round_number - a.round_number)[0] ?? null;
  const upcoming =
    rounds
      .filter((r) => r.status === "pending")
      .sort((a, b) => a.round_number - b.round_number)[0] ?? null;

  let studentsEnrolled = 0;
  if (teams.length > 0) {
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .in(
        "team_id",
        teams.map((t) => t.id)
      );
    studentsEnrolled = new Set(
      (members ?? []).map((m) => m.user_id).filter(Boolean)
    ).size;
  }

  return {
    sessionId: selected.id as string,
    name: selected.name as string,
    courseCode: (selected.course_code as string | null) ?? null,
    semester: (selected.semester as string | null) ?? null,
    status: selected.status as string,
    announcement: (selected.announcement as string | null) ?? null,
    practiceRounds: Number(selected.practice_rounds ?? 0),
    competitiveRounds: Number(selected.rounds_total ?? 0),
    practiceOpen: Boolean(
      openRound && openRound.round_type === "practice"
    ),
    studentsEnrolled,
    teamsCreated: teams.length,
    roundsCompleted: rounds.filter((r) => r.status === "closed").length,
    nextRoundLabel: upcoming ? roundLabel(upcoming) : null,
    currentRoundLabel: openRound
      ? roundLabel(openRound)
      : latestClosed
        ? roundLabel(latestClosed)
        : null,
    openRound,
    latestClosed,
    resultsAvailable: Boolean(latestClosed),
    teamIds: teams.map((t) => t.id),
    rounds,
  };
}
