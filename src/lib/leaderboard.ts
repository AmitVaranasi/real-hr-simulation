import type { LeaderboardEntry } from "@/lib/engine/types";

export function buildLeaderboard(
  teams: Array<{
    id: string;
    name: string;
    industry: string | null;
    strategy: string | null;
  }>,
  outcomes: Array<{
    team_id: string;
    total_score: number;
    instructor_override: number | null;
    revenue: number;
    stock_price: number;
  }>
): LeaderboardEntry[] {
  const entries = teams.map((team) => {
    const outcome = outcomes.find((o) => o.team_id === team.id);
    const score = outcome
      ? Number(outcome.instructor_override ?? outcome.total_score)
      : 0;
    return {
      rank: 0,
      team_id: team.id,
      team_name: team.name,
      industry: (team.industry ?? "—") as LeaderboardEntry["industry"],
      strategy: (team.strategy ?? "—") as LeaderboardEntry["strategy"],
      round_scores: [score],
      average_score: score,
      latest_score: score,
      latest_revenue: outcome ? Number(outcome.revenue) : 0,
      latest_stock_price: outcome ? Number(outcome.stock_price) : 0,
    };
  });

  entries.sort((a, b) => b.latest_score - a.latest_score);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  return entries;
}
