import { redirect } from "next/navigation";
import {
  StudentTutorial,
  type TutorialCompany,
} from "@/components/student/tutorial/StudentTutorial";
import { getIndustryConfig, getStrategyConfig } from "@/lib/engine/config";
import type { Industry, Strategy } from "@/lib/engine/types";
import { strategyPoints } from "@/lib/student/industry-strategy-brief";
import { safeNextPath, tutorialStatus } from "@/lib/student/tutorial";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Student Orientation" };

/**
 * First-time orientation for students: the case behind the simulation, what
 * the team is trying to accomplish, the seven HR decisions, and how the
 * portal's controls work. The portal stays locked until it is finished or
 * skipped (see middleware); it can be replayed at any time.
 */
export default async function TutorialPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/tutorial");

  const { data: membership } = await supabase
    .from("team_members")
    .select(
      "teams(name, industry, strategy, headcount, sessions(name, practice_rounds, rounds_total))"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const team = membership?.teams as unknown as {
    name: string;
    industry: string;
    strategy: string;
    headcount: number | null;
    sessions: {
      name: string;
      practice_rounds: number | null;
      rounds_total: number | null;
    } | null;
  } | null;

  let company: TutorialCompany | null = null;
  if (team) {
    const industry = getIndustryConfig(team.industry as Industry);
    const strategy = getStrategyConfig(team.strategy as Strategy);
    company = {
      name: team.name,
      industry: team.industry,
      strategy: team.strategy,
      courseName: team.sessions?.name ?? null,
      practiceRounds: team.sessions?.practice_rounds ?? 0,
      competitiveRounds: team.sessions?.rounds_total ?? 0,
      headcount: team.headcount ?? industry?.base_headcount ?? null,
      revenue: industry?.base_revenue ?? null,
      turnover: industry?.base_turnover ?? null,
      satisfaction: industry?.base_satisfaction ?? null,
      engagement: industry?.base_engagement ?? null,
      weights: strategy?.bsc_weights ?? null,
      strategyPoints: strategyPoints(team.strategy),
    };
  }

  return (
    <StudentTutorial
      company={company}
      replay={tutorialStatus(user.user_metadata) !== null}
      next={safeNextPath(params.next)}
    />
  );
}
