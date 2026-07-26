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

  if (profile?.role === "instructor") redirect("/sessions");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(id, name, industry, strategy, session_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    id: string;
    name: string;
    industry: string;
    strategy: string;
    session_id: string;
  } | null;

  if (!team) {
    return (
      <GettingStarted
        displayName={profile?.display_name ?? "Student"}
        hasTeam={false}
        teamName={null}
        industry={null}
        strategy={null}
        openRoundId={null}
        decisionDraft={false}
        decisionSubmitted={false}
        roundsCompleted={0}
      />
    );
  }

  const { data: openRound } = await supabase
    .from("rounds")
    .select("id")
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
        displayName={profile?.display_name ?? "Student"}
        hasTeam
        teamName={team.name}
        industry={team.industry}
        strategy={team.strategy}
        openRoundId={openRound?.id ?? null}
        decisionDraft={decisionDraft}
        decisionSubmitted={decisionSubmitted}
        roundsCompleted={roundsCompleted ?? 0}
      />
    </div>
  );
}
