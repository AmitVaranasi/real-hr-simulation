import type { LeaderboardEntry } from "@/lib/engine/types";

export function LeaderboardTable({
  entries,
  highlightTeamId,
}: {
  entries: LeaderboardEntry[];
  highlightTeamId?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Team</th>
            <th className="px-4 py-3">Industry</th>
            <th className="px-4 py-3">Strategy</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Revenue</th>
            <th className="px-4 py-3">Stock</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.team_id}
              className={`border-t border-slate-100 ${
                e.team_id === highlightTeamId ? "bg-[#fff4e8]" : ""
              }`}
            >
              <td className="px-4 py-3 font-bold text-[#e67e22]">#{e.rank}</td>
              <td className="px-4 py-3 font-medium">{e.team_name}</td>
              <td className="px-4 py-3">{e.industry}</td>
              <td className="px-4 py-3">{e.strategy}</td>
              <td className="px-4 py-3 font-semibold">
                {e.latest_score.toFixed(1)}
              </td>
              <td className="px-4 py-3">
                ${(e.latest_revenue / 1_000_000).toFixed(1)}M
              </td>
              <td className="px-4 py-3">${e.latest_stock_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
