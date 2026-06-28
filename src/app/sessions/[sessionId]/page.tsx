import { CreateTeamForm } from "@/components/instructor/CreateTeamForm";
import { RoundControls } from "@/components/instructor/RoundControls";
import { createClient } from "@/lib/supabase/server";
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

  const teams = session.teams ?? [];

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-4 py-10">
      <Link href="/sessions" className="text-sm text-indigo-600 hover:underline">
        ← All sessions
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{session.name}</h1>
      <p className="text-slate-600">Status: {session.status}</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Teams</h2>
        <p className="text-sm text-slate-500">
          Share each team&apos;s join code with students. They can enter it on{" "}
          <strong className="font-medium text-slate-700">Join a team</strong>{" "}
          from their dashboard after signing in, or use a direct link below.
        </p>
        <CreateTeamForm sessionId={sessionId} />
        <ul className="mt-4 space-y-2">
          {teams.map(
            (t: {
              id: string;
              name: string;
              join_code: string;
              industry: string;
              strategy: string;
            }) => (
              <li
                key={t.id}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-slate-500">
                  {t.industry} · {t.strategy}
                </p>
                <p className="mt-1 font-mono text-sm text-indigo-600">
                  Join code: {t.join_code}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Link: /join/{t.join_code}
                </p>
              </li>
            )
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Rounds</h2>
        <RoundControls sessionId={sessionId} rounds={rounds} />
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/sessions/${sessionId}/reports`}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
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
          href="/sessions/config"
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
        >
          Simulation config center →
        </Link>
      </section>
    </div>
  );
}
