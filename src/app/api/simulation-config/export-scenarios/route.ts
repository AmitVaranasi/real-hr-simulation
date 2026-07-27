import { requireInstructorOrAdmin } from "@/lib/api/auth";
import { withSimulationConfig } from "@/lib/db/simulation-config";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { createDefaultDecision } from "@/lib/engine/defaults";
import { runSimulationWithTrace } from "@/lib/engine/engine";
import { buildEffectiveConfigSnapshot } from "@/lib/engine/simulation-config";
import type { EconomyCondition, Industry, Strategy } from "@/lib/engine/types";
import { NextResponse } from "next/server";

const INDUSTRIES: Industry[] = [
  "Manufacturing",
  "Service",
  "High-Tech",
  "Banking",
  "Retail",
];

export async function POST(request: Request) {
  const { error } = await requireInstructorOrAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const strategy = (body.strategy ?? "Focus") as Strategy;
  const economy = (body.economy ?? "normal") as EconomyCondition;

  const payload = await withSimulationConfig(async () => {
    const effective = buildEffectiveConfigSnapshot();
    const scenarios = INDUSTRIES.map((industry) => {
      const outcome = runSimulationWithTrace(
        createDefaultDecision(),
        priorStateFromIndustry(industry),
        getIndustryConfig(industry),
        getStrategyConfig(strategy),
        economy
      );
      return {
        industry,
        strategy,
        economy,
        total_score: outcome.outcome.bsc_scores.total_score,
        profit: outcome.outcome.financial_metrics.profit,
        turnover: outcome.outcome.hr_metrics.turnover_rate,
        productivity: outcome.outcome.hr_metrics.productivity,
        trace: outcome.trace,
      };
    });

    return {
      exported_at: new Date().toISOString(),
      effective,
      scenarios: scenarios.map(({ trace: _t, ...rest }) => rest),
      scenarios_full: scenarios,
    };
  });

  const format = body.format ?? "json";
  if (format === "csv") {
    const header =
      "industry,strategy,economy,total_score,profit,turnover,productivity";
    const rows = payload.scenarios.map(
      (s) =>
        `${s.industry},${s.strategy},${s.economy},${s.total_score},${s.profit},${s.turnover},${s.productivity}`
    );
    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="scenario-export.csv"',
      },
    });
  }

  return NextResponse.json(payload);
}
