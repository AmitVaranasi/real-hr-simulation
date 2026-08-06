import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPageHeader } from "@/components/student/shell/StudentShell";

export const dynamic = "force-dynamic";

/**
 * Stable entry for "HR Decisions" nav.
 * Resolves the currently open round server-side so the sidebar never
 * has to guess a round id (which previously fell back to /dashboard).
 */
export default async function DecisionsEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/decisions");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(id, session_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    session_id: string;
  } | null;

  if (!team) {
    return (
      <div>
        <StudentPageHeader
          title="HR Decisions"
          subtitle="Join a company team before you can enter round decisions."
        />
        <p className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 text-sm text-[var(--portal-muted)] shadow-sm">
          You are not on a team yet.{" "}
          <Link
            href="/join"
            className="font-semibold text-[var(--portal-primary)] hover:underline"
          >
            Join a session →
          </Link>
        </p>
      </div>
    );
  }

  const { data: openRound } = await supabase
    .from("rounds")
    .select("id, round_number, status")
    .eq("session_id", team.session_id)
    .eq("status", "open")
    .maybeSingle();

  if (openRound?.id) {
    const qs = tab ? `?tab=${encodeURIComponent(tab)}` : "";
    redirect(`/round/${openRound.id}/decisions${qs}`);
  }

  return (
    <div>
      <StudentPageHeader
        title="HR Decisions"
        subtitle="Waiting for your instructor to open the next round."
      />
      <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <p className="text-sm text-[var(--portal-ink)]">
          There is no open round right now. HR Decisions unlocks when your
          instructor opens a practice or competitive round.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-[var(--portal-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--portal-primary-hover)]"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/dashboard/getting-started"
            className="rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2 text-sm font-semibold text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
          >
            Getting Started
          </Link>
        </div>
      </div>
    </div>
  );
}
