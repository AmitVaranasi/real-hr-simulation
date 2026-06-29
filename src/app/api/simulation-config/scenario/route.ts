import { requireInstructor } from "@/lib/api/auth";
import { withSimulationConfig } from "@/lib/db/simulation-config";
import {
  getIndustryConfig,
  getStrategyConfig,
  priorStateFromIndustry,
} from "@/lib/engine/config";
import { runSimulationWithTrace } from "@/lib/engine/engine";
import { createDefaultDecision } from "@/lib/engine/defaults";
import type { EconomyCondition, Industry, Strategy } from "@/lib/engine/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { error } = await requireInstructor();
  if (error) return error;

  const body = await request.json();
  const industry = (body.industry ?? "Manufacturing") as Industry;
  const strategy = (body.strategy ?? "Focus") as Strategy;
  const economy = (body.economy ?? "normal") as EconomyCondition;
  const decision = body.decision ?? createDefaultDecision();

  const result = await withSimulationConfig(() => {
    const industryConfig = getIndustryConfig(industry);
    const strategyConfig = getStrategyConfig(strategy);
    const prior = priorStateFromIndustry(industry);
    return runSimulationWithTrace(
      decision,
      prior,
      industryConfig,
      strategyConfig,
      economy
    );
  });

  return NextResponse.json({
    industry,
    strategy,
    economy,
    outcome: result.outcome,
    trace: result.trace,
  });
}
