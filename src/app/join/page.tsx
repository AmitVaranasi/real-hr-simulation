import Link from "next/link";
import { JoinTeamForm } from "@/components/student/JoinTeamForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/join");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/admin");
  }
  if (profile?.role === "instructor") {
    redirect("/sessions");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(name, sessions(name, course_code))")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentTeam = membership?.teams as unknown as {
    name: string;
    sessions: { name: string; course_code: string | null } | null;
  } | null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-md px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-primary)]">
        Student portal
      </p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--portal-ink)]">
        {currentTeam ? "Join a new session" : "Join your team"}
      </h1>
      <p className="mt-2 text-sm text-[var(--portal-muted)]">
        {currentTeam
          ? "Enter a join code from another class session. This will switch you to that team (one active team at a time)."
          : "Enter the join code your instructor gave you to join your company team."}
      </p>

      {currentTeam && (
        <div className="mt-4 rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
            Current team
          </p>
          <p className="mt-1 font-semibold text-[var(--portal-ink)]">{currentTeam.name}</p>
          <p className="text-[var(--portal-muted)]">
            {[currentTeam.sessions?.name, currentTeam.sessions?.course_code]
              .filter(Boolean)
              .join(" · ") || "Active session"}
          </p>
        </div>
      )}

      <JoinTeamForm allowSwitch={!!currentTeam} />

      <p className="mt-8 text-center text-sm text-[var(--portal-muted)]">
        <Link href="/dashboard" className="font-medium text-[var(--portal-primary)] hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
