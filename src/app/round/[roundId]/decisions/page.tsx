import { DecisionWorkspace } from "@/components/decisions/DecisionWorkspace";
import { createClient } from "@/lib/supabase/server";
import type { EconomyCondition, Industry, Strategy } from "@/lib/engine/types";
import { redirect } from "next/navigation";

export default async function RoundDecisionsPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(*)")
    .eq("user_id", user.id)
    .single();

  const team = membership?.teams as unknown as {
    id: string;
    industry: Industry;
    strategy: Strategy;
  } | null;

  if (!team) redirect("/dashboard");

  const { data: round } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .single();

  if (!round) {
    return <p className="p-8">Round not found</p>;
  }

  const { data: decision } = await supabase
    .from("decisions")
    .select("*")
    .eq("team_id", team.id)
    .eq("round_id", roundId)
    .maybeSingle();

  return (
    <DecisionWorkspace
      teamId={team.id}
      roundId={roundId}
      industry={team.industry ?? "Manufacturing"}
      strategy={team.strategy ?? "Focus"}
      economy={round.economy_condition as EconomyCondition}
      initialDecision={decision}
      roundOpen={round.status === "open"}
      roundNumber={round.round_number}
    />
  );
}
