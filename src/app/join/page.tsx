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
      <p className="text-xs font-semibold uppercase tracking-wider text-[#e67e22]">
        Student portal
      </p>
      <h1 className="mt-1 text-2xl font-bold text-[#1f2937]">
        {currentTeam ? "Join a new session" : "Join your team"}
      </h1>
      <p className="mt-2 text-sm text-[#6b7280]">
        {currentTeam
          ? "Enter a join code from another class session. This will switch you to that team (one active team at a time)."
          : "Enter the join code your instructor gave you to join your company team."}
      </p>

      {currentTeam && (
        <div className="mt-4 rounded-lg border border-[#dde1e6] bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
            Current team
          </p>
          <p className="mt-1 font-semibold text-[#1f2937]">{currentTeam.name}</p>
          <p className="text-[#6b7280]">
            {[currentTeam.sessions?.name, currentTeam.sessions?.course_code]
              .filter(Boolean)
              .join(" · ") || "Active session"}
          </p>
        </div>
      )}

      <JoinTeamForm allowSwitch={!!currentTeam} />

      <p className="mt-8 text-center text-sm text-[#6b7280]">
        <Link href="/dashboard" className="font-medium text-[#e67e22] hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
