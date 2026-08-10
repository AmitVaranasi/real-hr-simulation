import { createClient } from "@/lib/supabase/server";
import {
  formatAsOfDate,
  mapOutcomesToRounds,
} from "@/lib/reports/statement-data";
import type { FinancialRoundItem } from "@/components/reports/FinancialReportChrome";

export type ReportPageData = {
  rounds: FinancialRoundItem[];
  selectedRoundId: string | null;
  roundNumber: number;
  asOfLabel: string;
  liveRevenue: number | null;
  liveProfit: number | null;
  liveProfitMargin: number | null;
  liveCompensation: number | null;
  liveTurnover: number | null;
  liveCashflow: number | null;
  liveHeadcount: number | null;
};

export async function loadFinancialReportData(
  basePath: string,
  roundQuery?: string | null
): Promise<ReportPageData> {
  const empty: ReportPageData = {
    rounds: [],
    selectedRoundId: null,
    roundNumber: 1,
    asOfLabel: "July 31, 2026",
    liveRevenue: null,
    liveProfit: null,
    liveProfitMargin: null,
    liveCompensation: null,
    liveTurnover: null,
    liveCashflow: null,
    liveHeadcount: null,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.team_id) return empty;

  const { data: outcomes } = await supabase
    .from("outcomes")
    .select(
      "id, round_id, computed_at, revenue, profit, profit_margin, total_compensation, turnover_cost, cashflow, headcount, rounds(id, round_number, status, closed_at)"
    )
    .eq("team_id", membership.team_id)
    .order("computed_at", { ascending: false });

  const list = outcomes ?? [];
  const rounds = mapOutcomesToRounds(list as Array<Record<string, unknown>>, basePath);

  const selected =
    (roundQuery
      ? list.find((o) => o.round_id === roundQuery)
      : list[0]) ?? null;

  const round = selected?.rounds as unknown as {
    round_number: number;
    closed_at: string | null;
  } | null;

  return {
    rounds,
    selectedRoundId: (selected?.round_id as string | undefined) ?? null,
    roundNumber: round?.round_number ?? 1,
    asOfLabel: formatAsOfDate(
      round?.closed_at ?? (selected?.computed_at as string | undefined)
    ),
    liveRevenue:
      selected?.revenue != null ? Number(selected.revenue) : null,
    liveProfit: selected?.profit != null ? Number(selected.profit) : null,
    liveProfitMargin:
      selected?.profit_margin != null
        ? Number(selected.profit_margin)
        : null,
    liveCompensation:
      selected?.total_compensation != null
        ? Number(selected.total_compensation)
        : null,
    liveTurnover:
      selected?.turnover_cost != null
        ? Number(selected.turnover_cost)
        : null,
    liveCashflow:
      selected?.cashflow != null ? Number(selected.cashflow) : null,
    liveHeadcount:
      selected?.headcount != null ? Number(selected.headcount) : null,
  };
}
