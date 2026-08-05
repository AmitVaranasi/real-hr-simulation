import Link from "next/link";
import { GettingStarted } from "@/components/student/GettingStarted";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GettingStartedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/getting-started");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "instructor") redirect("/sessions");

  const displayName = profile?.display_name ?? "Student";
  const firstName = displayName.trim().split(/\s+/)[0] || "Student";

  const { data: membership } = await supabase
    .from("team_members")
    .select(
      "team_id, teams(id, name, industry, strategy, session_id, sessions(name, course_code, semester))"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    industry: string;
    strategy: string;
    session_id: string;
    sessions: {
      name: string;
      course_code: string | null;
      semester: string | null;
    };
  } | null;

  if (!team) {
    return (
      <GettingStarted
        displayName={displayName}
        firstName={firstName}
        hasTeam={false}
        teamName={null}
        courseLabel="—"
        industry={null}
        strategy={null}
        openRoundId={null}
        openRoundLabel="Not Open — Waiting for Instructor"
        decisionDraft={false}
        decisionSubmitted={false}
        roundsCompleted={0}
      />
    );
  }

  const courseLabel = [
    team.sessions?.name,
    team.sessions?.course_code,
    team.sessions?.semester,
  ]
    .filter(Boolean)
    .join(" · ");

  const { data: openRound } = await supabase
    .from("rounds")
    .select("id, round_number, status")
    .eq("session_id", team.session_id)
    .eq("status", "open")
    .maybeSingle();

  let decisionDraft = false;
  let decisionSubmitted = false;
  if (openRound) {
    const { data: decision } = await supabase
      .from("decisions")
      .select("is_submitted")
      .eq("team_id", team.id)
      .eq("round_id", openRound.id)
      .maybeSingle();
    if (decision) {
      decisionDraft = true;
      decisionSubmitted = !!decision.is_submitted;
    }
  }

  const { count: roundsCompleted } = await supabase
    .from("outcomes")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Go to Dashboard
          </Button>
        </Link>
      </div>
      <GettingStarted
        displayName={displayName}
        firstName={firstName}
        hasTeam
        teamName={team.name}
        courseLabel={courseLabel || team.sessions?.name || "—"}
        industry={team.industry}
        strategy={team.strategy}
        openRoundId={openRound?.id ?? null}
        openRoundLabel={
          openRound
            ? `Round ${openRound.round_number} — ${openRound.status.toUpperCase()}`
            : "Not Open — Waiting for Instructor"
        }
        decisionDraft={decisionDraft}
        decisionSubmitted={decisionSubmitted}
        roundsCompleted={roundsCompleted ?? 0}
      />
    </div>
  );
}
