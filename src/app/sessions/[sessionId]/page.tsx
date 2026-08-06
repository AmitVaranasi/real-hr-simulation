import { CreateTeamForm } from "@/components/instructor/CreateTeamForm";
import { EditTeamForm } from "@/components/instructor/EditTeamForm";
import { ResetStudentPasswordForm } from "@/components/instructor/ResetStudentPasswordForm";
import { RoundControls } from "@/components/instructor/RoundControls";
import { SessionAnnouncementForm } from "@/components/instructor/SessionAnnouncementForm";
import { createClient } from "@/lib/supabase/server";
import type { Industry, Strategy } from "@/lib/engine/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
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

  const rounds = (session.rounds ?? []) as Array<{
    id: string;
    round_number: number;
    round_type: string;
    status: string;
    economy_condition: "boom" | "normal" | "recession";
  }>;

  const teams = (session.teams ?? []) as Array<{
    id: string;
    name: string;
    join_code: string;
    industry: Industry;
    strategy: Strategy;
  }>;

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/sessions"
          className="text-[var(--portal-accent-blue)] hover:underline"
        >
          ← Dashboard
        </Link>
        <span className="text-[var(--portal-sidebar-border)]">|</span>
        <Link
          href={`/sessions/${sessionId}/course`}
          className="text-[var(--portal-accent-blue)] hover:underline"
        >
          Course Overview
        </Link>
        <span className="text-[var(--portal-sidebar-border)]">|</span>
        <Link
          href="/sessions/manage"
          className="text-[var(--portal-accent-blue)] hover:underline"
        >
          Manage Course
        </Link>
      </div>
      <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--portal-title)]">
          {session.name}
        </h1>
        <p className="mt-1 text-[var(--portal-muted)]">
          Status: {session.status} · {session.practice_rounds} practice +{" "}
          {session.rounds_total} competitive rounds
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <Link
            href={`/sessions/${sessionId}/teams`}
            className="rounded-md bg-[var(--portal-accent-blue-soft)] px-2.5 py-1 text-[var(--portal-accent-blue)]"
          >
            Teams
          </Link>
          <Link
            href={`/sessions/${sessionId}/announcements`}
            className="rounded-md bg-[var(--portal-accent-blue-soft)] px-2.5 py-1 text-[var(--portal-accent-blue)]"
          >
            Announcements
          </Link>
          <Link
            href={`/sessions/${sessionId}/rounds`}
            className="rounded-md bg-[var(--portal-accent-blue-soft)] px-2.5 py-1 text-[var(--portal-accent-blue)]"
          >
            Rounds
          </Link>
        </div>
      </div>

      <section className="mt-10 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--portal-title)]">Announcements</h2>
        <SessionAnnouncementForm
          sessionId={sessionId}
          initialAnnouncement={
            (session.announcement as string | null) ?? null
          }
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--portal-title)]">Teams</h2>
        <p className="text-sm text-[var(--portal-muted)]">
          Share each team&apos;s join code with students. Edit industry and
          strategy anytime before play begins.
        </p>
        <CreateTeamForm sessionId={sessionId} />
        <ul className="mt-4 space-y-3">
          {teams.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-4 py-3"
            >
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-[var(--portal-muted)]">
                {t.industry} · {t.strategy}
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--portal-primary)]">
                Join code: {t.join_code}
              </p>
              <p className="mt-1 text-xs text-[var(--portal-muted)]">
                Link: /join/{t.join_code}
              </p>
              <EditTeamForm sessionId={sessionId} team={t} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--portal-title)]">
          Round processing
        </h2>
        <RoundControls sessionId={sessionId} rounds={rounds} />
      </section>

      <section className="mt-10 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--portal-title)]">
          Student password reset
        </h2>
        <ResetStudentPasswordForm sessionId={sessionId} />
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/sessions/${sessionId}/reports`}
          className="rounded-lg border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)] px-4 py-3 text-sm font-medium text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
        >
          Class reports & export →
        </Link>
        <Link
          href={`/sessions/${sessionId}/leaderboard`}
          className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--portal-ink)] hover:bg-[var(--portal-page)]"
        >
          Leaderboard control →
        </Link>
        <Link
          href={`/sessions/${sessionId}/inspect`}
          className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--portal-ink)] hover:bg-[var(--portal-page)]"
        >
          Formula inspector →
        </Link>
        <Link
          href="/sessions/testing"
          className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--portal-ink)] hover:bg-[var(--portal-page)]"
        >
          Testing Center →
        </Link>
        <Link
          href="/sessions/config"
          className="rounded-lg border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)] px-4 py-3 text-sm font-medium text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
        >
          Simulation config center →
        </Link>
      </section>
    </div>
  );
}
