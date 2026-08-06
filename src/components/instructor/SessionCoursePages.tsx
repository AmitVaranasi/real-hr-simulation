import { CreateTeamForm } from "@/components/instructor/CreateTeamForm";
import { EditTeamForm } from "@/components/instructor/EditTeamForm";
import { ResetStudentPasswordForm } from "@/components/instructor/ResetStudentPasswordForm";
import { RoundControls } from "@/components/instructor/RoundControls";
import { SessionAnnouncementForm } from "@/components/instructor/SessionAnnouncementForm";
import {
  ProfessorCardGrid,
  ProfessorPageHeader,
} from "@/components/instructor/ProfessorShell";
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

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl">
      <ProfessorPageHeader
        title="Course Overview"
        subtitle={`${session.name} — manage structure, enrollment, announcements, and rounds.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Course Management", href: "/sessions/manage" },
          { label: "Course Overview" },
        ]}
      />

      <div className="mb-5 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-[var(--portal-muted)]">Status</p>
        <p className="text-lg font-semibold text-[var(--portal-title)]">
          {session.status} · {session.practice_rounds} practice +{" "}
          {session.rounds_total} competitive rounds
        </p>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          {teams.length} team(s) · {rounds.length} round record(s)
        </p>
      </div>

      <ProfessorCardGrid
        items={[
          {
            title: "Teams & Enrollment",
            body: "Create teams, edit industry/strategy, and share join codes.",
            href: `/sessions/${sessionId}/teams`,
          },
          {
            title: "Announcements",
            body: "Post instructor messages visible to enrolled students.",
            href: `/sessions/${sessionId}/announcements`,
          },
          {
            title: "Round Management",
            body: "Open, close, and process rounds for this course session.",
            href: `/sessions/${sessionId}/rounds`,
          },
          {
            title: "Class Performance",
            body: "Industry results, leaderboard, and analytics shells.",
            href: `/sessions/${sessionId}/reports`,
          },
        ]}
      />

      <section className="mt-6 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-[var(--portal-title)]">
          Student password reset
        </h2>
        <div className="mt-3">
          <ResetStudentPasswordForm sessionId={sessionId} />
        </div>
      </section>

      <p className="mt-4 text-sm">
        <Link
          href={`/sessions/${sessionId}`}
          className="font-semibold text-[var(--portal-accent-blue)] hover:underline"
        >
          Open classic session workspace →
        </Link>
      </p>
    </div>
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

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl">
      <ProfessorPageHeader
        title="Teams & Enrollment"
        subtitle="Share each team's join code with students. Edit industry and strategy anytime before play begins."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Course Management", href: `/sessions/${sessionId}/course` },
          { label: "Teams & Enrollment" },
        ]}
      />
      <CreateTeamForm sessionId={sessionId} />
      <ul className="mt-4 space-y-3">
        {teams.map((t) => (
          <li
            key={t.id}
            className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-4 py-3"
          >
            <p className="font-medium text-[var(--portal-title)]">{t.name}</p>
            <p className="text-sm text-[var(--portal-muted)]">
              {t.industry} · {t.strategy}
            </p>
            <p className="mt-1 font-mono text-sm text-[var(--portal-primary)]">
              Join code: {t.join_code}
            </p>
            <EditTeamForm sessionId={sessionId} team={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SessionAnnouncementsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await loadSession(sessionId);
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <ProfessorPageHeader
        title="Announcements"
        subtitle="Messages shown to students under Team & Company → Instructor Information."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Course Management", href: `/sessions/${sessionId}/course` },
          { label: "Announcements" },
        ]}
      />
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <SessionAnnouncementForm
          sessionId={sessionId}
          initialAnnouncement={(session.announcement as string | null) ?? null}
        />
      </section>
    </div>
  );
}

export async function SessionRoundsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await loadSession(sessionId);
  const rounds = (session.rounds ?? []) as Array<{
    id: string;
    round_number: number;
    round_type: string;
    status: string;
    economy_condition: "boom" | "normal" | "recession";
  }>;

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl">
      <ProfessorPageHeader
        title="Round Management"
        subtitle="Open, close, and process rounds for this course session."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Course Management", href: `/sessions/${sessionId}/course` },
          { label: "Round Management" },
        ]}
      />
      <RoundControls sessionId={sessionId} rounds={rounds} />
    </div>
  );
}
