import { ResourcesOverview } from "@/components/student/ResourcesOverview";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResourcesHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/resources");

  const { data: membership } = await supabase
    .from("team_members")
    .select("teams(name, industry, strategy, session_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    name: string;
    industry: string;
    strategy: string;
    session_id: string;
  } | null;

  let openRound: {
    round_number: number;
    economy_condition: string;
  } | null = null;
  if (team) {
    const { data } = await supabase
      .from("rounds")
      .select("round_number, economy_condition")
      .eq("session_id", team.session_id)
      .eq("status", "open")
      .maybeSingle();
    openRound = data;
  }

  return (
    <ResourcesOverview
      context={{
        roundLabel: openRound
          ? `Round ${openRound.round_number}`
          : "No open round",
        roundOpen: Boolean(openRound),
        industry: team?.industry ?? "—",
        strategy: team?.strategy ?? "—",
        economy: openRound
          ? openRound.economy_condition.charAt(0).toUpperCase() +
            openRound.economy_condition.slice(1)
          : "—",
      }}
    />
  );
}
