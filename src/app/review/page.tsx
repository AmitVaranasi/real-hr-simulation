import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPageHeader } from "@/components/student/shell/StudentShell";

export const dynamic = "force-dynamic";

/** Stable entry for Review & Submit — same pattern as /decisions. */
export default async function ReviewEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/review");

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
          title="Review & Submit"
          subtitle="Join a company team before you can review round decisions."
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
    .select("id")
    .eq("session_id", team.session_id)
    .eq("status", "open")
    .maybeSingle();

  if (openRound?.id) {
    redirect(`/round/${openRound.id}/review`);
  }

  return (
    <div>
      <StudentPageHeader
        title="Review & Submit"
        subtitle="Waiting for your instructor to open the next round."
      />
      <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <p className="text-sm text-[var(--portal-ink)]">
          Review &amp; Submit is available once a round is open and your team
          has started decisions.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex rounded-md bg-[var(--portal-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--portal-primary-hover)]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
