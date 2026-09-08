import {
  PlusSquare,
  Settings,
  Users,
  Waypoints,
} from "lucide-react";
import { AnnouncementsHub } from "@/components/instructor/AnnouncementsHub";
import {
  ProfessorCourseStatus,
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  ProfessorSystemStatus,
} from "@/components/instructor/ProfessorChrome";
import { courseRail, loadActiveCourse, roundLabel } from "@/lib/instructor/load-course-context";
import { ResetStudentPasswordForm } from "@/components/instructor/ResetStudentPasswordForm";
import { RoundControls } from "@/components/instructor/RoundControls";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import { TeamsEnrollmentHub } from "@/components/instructor/TeamsEnrollmentHub";
import { createClient } from "@/lib/supabase/server";
import type { Industry, Strategy } from "@/lib/engine/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

async function loadSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("sessions")
    .select("*, rounds(*), teams(*)")
    .eq("id", sessionId)
    .eq("instructor_id", user.id)
    .single();

  if (!session) notFound();
  return session;
}

export default async function SessionCourseOverviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await loadSession(sessionId);
  const rounds = (session.rounds ?? []) as Array<{ id: string }>;
  const teams = (session.teams ?? []) as Array<{ id: string }>;

  const practiceOpen = ((session.rounds ?? []) as Array<{ status: string; round_type: string }>).some(
    (r) => r.status === "open" && r.round_type === "practice"
  );
  const completed = ((session.rounds ?? []) as Array<{ status: string }>).filter(
    (r) => r.status === "closed"
  ).length;

  return (
    <ProfessorPageGrid
      rail={
        <>
          <ProfessorCourseStatus
            state={{
              sessionId,
              practiceOpen,
              competitiveRounds: Number(session.rounds_total ?? 0),
              teamsCreated: teams.length,
              roundsCompleted: completed,
            }}
          />
          <ProfessorSystemStatus />
        </>
      }
    >
      <ProfessorPageHeader
        title="Course Overview"
        subtitle={`${session.name} — session identity, status, and structure. Enrollment, announcements, and round controls live in their own areas.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Course Management", href: "/sessions/manage" },
          { label: "Course Overview" },
        ]}
      />

      <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-[var(--portal-muted)]">Status</p>
        <p className="text-lg font-semibold text-[var(--portal-title)]">
          {session.status} · {session.practice_rounds} practice +{" "}
          {session.rounds_total} competitive rounds
        </p>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          {teams.length} team(s) · {rounds.length} round record(s)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          { label: "Session", value: session.name as string },
          { label: "Course Code", value: (session.course_code as string | null) ?? "—" },
          { label: "Semester", value: (session.semester as string | null) ?? "—" },
          { label: "Status", value: session.status as string },
        ].map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-3 py-3 shadow-sm"
          >
            <p className="text-[0.5625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
              {tile.label}
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--portal-title)]">
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-[var(--portal-title)]">
          Student password reset
        </h2>
        <div className="mt-3">
          <ResetStudentPasswordForm sessionId={sessionId} />
        </div>
      </section>

      <ProfessorHelpBanner
        title="Need help setting up the course?"
        body="Visit the Professor Guide for session setup, teams, and round cadence."
      />

      <p className="text-sm">
        <Link
          href={`/sessions/${sessionId}`}
          className="font-semibold text-[var(--portal-accent-blue)] hover:underline"
        >
          Open classic session workspace →
        </Link>
      </p>
    </ProfessorPageGrid>
  );
}

export async function SessionTeamsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await loadSession(sessionId);
  const teams = (session.teams ?? []) as Array<{
    id: string;
    name: string;
    join_code: string;
    industry: Industry;
    strategy: Strategy;
  }>;

  const supabase = await createClient();
  const membersByTeam = new Map<string, string[]>();
  if (teams.length > 0) {
    const { data: members } = await supabase
      .from("team_members")
      .select("team_id, profiles(display_name)")
      .in(
        "team_id",
        teams.map((t) => t.id)
      );
    for (const row of members ?? []) {
      const teamId = row.team_id as string;
      const profile = row.profiles as { display_name?: string } | { display_name?: string }[] | null;
      const name = Array.isArray(profile)
        ? profile[0]?.display_name
        : profile?.display_name;
      const list = membersByTeam.get(teamId) ?? [];
      if (name) list.push(name);
      membersByTeam.set(teamId, list);
    }
  }

  const practiceOpen = ((session.rounds ?? []) as Array<{ status: string; round_type: string }>).some(
    (r) => r.status === "open" && r.round_type === "practice"
  );

  return (
    <TeamsEnrollmentHub
      sessionId={sessionId}
      competitiveRounds={Number(session.rounds_total ?? 0)}
      practiceRounds={Number(session.practice_rounds ?? 0)}
      rail={{
        sessionId,
        practiceOpen,
        competitiveRounds: Number(session.rounds_total ?? 0),
        studentsEnrolled: [...membersByTeam.values()].reduce(
          (n, list) => n + list.length,
          0
        ),
        teamsCreated: teams.length,
        nextRoundLabel: null,
      }}
      teams={teams.map((t) => ({
        ...t,
        members: membersByTeam.get(t.id) ?? [],
      }))}
    />
  );
}

export async function SessionAnnouncementsPage({
  params,
  view = "all",
}: {
  params: Promise<{ sessionId: string }>;
  view?: "all" | "scheduled" | "drafts" | "archived";
}) {
  const { sessionId } = await params;
  const course = await loadActiveCourse(sessionId);
  if (!course) notFound();
  return (
    <AnnouncementsHub
      sessionId={sessionId}
      announcement={course.announcement}
      initialView={view}
      rail={courseRail(course)}
      roundOptions={course.rounds.map((round) => roundLabel(round))}
    />
  );
}

export async function SessionRoundsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await loadSession(sessionId);
  const teams = (session.teams ?? []) as Array<{ id: string }>;
  const rounds = (session.rounds ?? []) as Array<{
    id: string;
    round_number: number;
    round_type: string;
    status: string;
    economy_condition: "boom" | "normal" | "recession";
    opened_at?: string | null;
    closed_at?: string | null;
    decision_deadline?: string | null;
  }>;

  const supabase = await createClient();
    const submittedTeams = new Map<string, Set<string>>();
  if (rounds.length > 0) {
    const { data: decisions } = await supabase
      .from("decisions")
      .select("round_id, team_id, is_submitted")
      .in(
        "round_id",
        rounds.map((r) => r.id)
      )
      .eq("is_submitted", true);
    for (const row of decisions ?? []) {
      const rid = row.round_id as string;
      const tid = row.team_id as string | null;
      if (!tid) continue;
      const set = submittedTeams.get(rid) ?? new Set<string>();
      set.add(tid);
      submittedTeams.set(rid, set);
    }
  }

  const practiceOpen = rounds.some(
    (r) => r.status === "open" && r.round_type === "practice"
  );
  const upcoming = rounds
    .filter((r) => r.status === "pending")
    .sort((a, b) => a.round_number - b.round_number)[0];

  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Round Actions"
          course={{
            sessionId,
            practiceOpen,
            competitiveRounds: Number(session.rounds_total ?? 0),
            teamsCreated: teams.length,
            roundsCompleted: rounds.filter((r) => r.status === "closed").length,
            nextRoundLabel: upcoming
              ? `${upcoming.round_type === "practice" ? "Practice" : "Competitive"} Round ${upcoming.round_number}`
              : "—",
          }}
          tools={[
            {
              title: "Create New Round",
              icon: <PlusSquare className="h-4 w-4" strokeWidth={1.75} />,
              body: "Rounds are created with the course session. This is not a second round factory.",
              action: "Session Setup",
              href: `/sessions/${sessionId}/course`,
            },
            {
              title: "Round Settings",
              icon: <Settings className="h-4 w-4" strokeWidth={1.75} />,
              body: "Economy and processing live on each round row.",
              action: "Manage Settings",
              href: `/sessions/${sessionId}/course`,
            },
            {
              title: "Decision Areas",
              icon: <Waypoints className="h-4 w-4" strokeWidth={1.75} />,
              body: "The seven HR modules students complete each open round.",
              action: "View Areas",
              href: `/sessions/${sessionId}/rounds#decision-areas`,
            },
            {
              title: "Scoring & Feedback",
              icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
              body: "Formulas and diagnostics live in Simulation Lab.",
              action: "Open Configuration",
              href: "/sessions/config",
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title="Round Management"
        subtitle="Create, configure, and manage practice and competitive rounds. Set timing, decisions, and scoring rules."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Course Management", href: `/sessions/manage` },
          { label: "Round Management" },
        ]}
      />
      <RoundControls
        sessionId={sessionId}
        teamCount={teams.length}
        rounds={rounds
          .slice()
          .sort((a, b) => a.round_number - b.round_number)
          .map((r) => ({
            id: r.id,
            round_number: r.round_number,
            round_type: r.round_type,
            status: r.status,
            economy_condition: r.economy_condition,
            opened_at: r.opened_at ?? null,
            closed_at: r.closed_at ?? null,
            decision_deadline: r.decision_deadline ?? null,
            submittedCount: submittedTeams.get(r.id)?.size ?? 0,
          }))}
      />
      <ProfessorHelpBanner
        title="Need help setting up rounds?"
        body="Visit the Professor Guide for opening, closing, and processing rounds through the existing engine."
      />
    </ProfessorPageGrid>
  );
}
