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
        <Link href="/sessions" className="text-[#e67e22] hover:underline">
          ← Dashboard
        </Link>
        <span className="text-slate-300">|</span>
        <Link href="/sessions/manage" className="text-[#e67e22] hover:underline">
          Manage Course
        </Link>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{session.name}</h1>
        <p className="mt-1 text-slate-600">
          Status: {session.status} · {session.practice_rounds} practice +{" "}
          {session.rounds_total} competitive rounds
        </p>
      </div>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Announcements</h2>
        <SessionAnnouncementForm
          sessionId={sessionId}
          initialAnnouncement={
            (session.announcement as string | null) ?? null
          }
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Teams</h2>
        <p className="text-sm text-slate-500">
          Share each team&apos;s join code with students. Edit industry and
          strategy anytime before play begins.
        </p>
        <CreateTeamForm sessionId={sessionId} />
        <ul className="mt-4 space-y-3">
          {teams.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-slate-500">
                {t.industry} · {t.strategy}
              </p>
              <p className="mt-1 font-mono text-sm text-[#e67e22]">
                Join code: {t.join_code}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Link: /join/{t.join_code}
              </p>
              <EditTeamForm sessionId={sessionId} team={t} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">
          Round processing
        </h2>
        <RoundControls sessionId={sessionId} rounds={rounds} />
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Student password reset
        </h2>
        <ResetStudentPasswordForm sessionId={sessionId} />
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/sessions/${sessionId}/reports`}
          className="rounded-lg border border-[#f5d0a9] bg-[#fff4e8] px-4 py-3 text-sm font-medium text-[#c45f12] hover:bg-[#ffe8d1]"
        >
          Class reports & export →
        </Link>
        <Link
          href={`/sessions/${sessionId}/leaderboard`}
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Leaderboard control →
        </Link>
        <Link
          href={`/sessions/${sessionId}/inspect`}
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Formula inspector →
        </Link>
        <Link
          href="/sessions/testing"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Testing Center →
        </Link>
        <Link
          href="/sessions/config"
          className="rounded-lg border border-[#f5d0a9] bg-[#fff4e8] px-4 py-3 text-sm font-medium text-[#c45f12] hover:bg-[#ffe8d1]"
        >
          Simulation config center →
        </Link>
      </section>
    </div>
  );
}
