import * as XLSX from "xlsx";

export interface ClassExportData {
  sessionName: string;
  teams: Array<{
    id: string;
    name: string;
    industry: string;
    strategy: string;
  }>;
  rounds: Array<{ id: string; round_number: number; round_type: string }>;
  outcomes: Array<Record<string, unknown>>;
  decisions: Array<Record<string, unknown>>;
  reflections: Array<Record<string, unknown>>;
}

export function generateClassExcel(data: ClassExportData): void {
  const wb = XLSX.utils.book_new();

  const summaryRows = data.teams.map((team) => {
    const teamOutcomes = data.outcomes.filter((o) => o.team_id === team.id);
    const row: Record<string, string | number> = {
      Team: team.name,
      Industry: team.industry,
      Strategy: team.strategy,
    };
    for (const o of teamOutcomes) {
      const round = data.rounds.find((r) => r.id === o.round_id);
      const key = round
        ? `R${round.round_number} Score`
        : `Round ${o.round_id}`;
      row[key] = Number(o.instructor_override ?? o.total_score);
    }
    const competitive = teamOutcomes.filter((o) => {
      const r = data.rounds.find((rd) => rd.id === o.round_id);
      return r?.round_type === "competitive";
    });
    if (competitive.length > 0) {
      row.Average =
        competitive.reduce(
          (s, o) => s + Number(o.instructor_override ?? o.total_score),
          0
        ) / competitive.length;
    }
    return row;
  });
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(summaryRows),
    "Summary"
  );

  const metricRows = data.outcomes.map((o) => {
    const team = data.teams.find((t) => t.id === o.team_id);
    const round = data.rounds.find((r) => r.id === o.round_id);
    return {
      Team: team?.name,
      Round: round?.round_number,
      TotalScore: o.instructor_override ?? o.total_score,
      Satisfaction: o.employee_satisfaction,
      Turnover: o.turnover_rate,
      Productivity: o.productivity,
      HiringQuality: o.hiring_quality,
      TurnoverCost: o.turnover_cost,
      Revenue: o.revenue,
      Profit: o.profit,
      StockPrice: o.stock_price,
    };
  });
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(metricRows),
    "Metrics"
  );

  const decisionRows = data.decisions.map((d) => {
    const team = data.teams.find((t) => t.id === d.team_id);
    const round = data.rounds.find((r) => r.id === d.round_id);
    return {
      Team: team?.name,
      Round: round?.round_number,
      Submitted: d.is_submitted,
      RecruitmentBudget: d.recruitment_budget_per_hire,
      Positions: d.positions_to_fill,
      TrainingPerEE: d.training_budget_per_ee,
      SalaryVsMarket: d.salary_vs_market_pct,
    };
  });
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(decisionRows),
    "Decisions"
  );

  const reflectionRows = data.reflections.map((r) => {
    const team = data.teams.find((t) => t.id === r.team_id);
    const round = data.rounds.find((rd) => rd.id === r.round_id);
    return {
      Team: team?.name,
      Round: round?.round_number,
      Content: r.content,
      SubmittedAt: r.submitted_at,
    };
  });
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(reflectionRows),
    "Reflections"
  );

  XLSX.writeFile(
    wb,
    `${data.sessionName.replace(/\s+/g, "_")}_class_export.xlsx`
  );
}
