import { requireInstructor } from "@/lib/api/auth";
import { priorStateFromIndustry } from "@/lib/engine/config";
import type { Industry, Strategy } from "@/lib/engine/types";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const { name, industry, strategy } = await request.json();
  if (!name || !industry || !strategy) {
    return NextResponse.json(
      { error: "name, industry, and strategy are required" },
      { status: 400 }
    );
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const prior = priorStateFromIndustry(industry as Industry);

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      session_id: sessionId,
      name,
      industry: industry as Industry,
      strategy: strategy as Strategy,
      headcount: prior.headcount,
      revenue: prior.revenue,
      stock_price: prior.stock_price,
      market_share: prior.market_share,
      profit_margin: prior.profit_margin,
      satisfaction: prior.satisfaction,
      engagement: prior.engagement,
      turnover_rate: prior.turnover_rate,
      budget_carryover: 0,
    })
    .select()
    .single();

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 500 });
  }

  return NextResponse.json({ team }, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { error, supabase, user } = await requireInstructor();
  if (error) return error;

  const body = await request.json();
  const { teamId, name, industry, strategy } = body as {
    teamId?: string;
    name?: string;
    industry?: Industry;
    strategy?: Strategy;
  };

  if (!teamId) {
    return NextResponse.json({ error: "teamId is required" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("instructor_id", user!.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (industry) {
    updates.industry = industry;
    const prior = priorStateFromIndustry(industry);
    // Refresh baseline metrics when industry changes (pre-play adjustment).
    updates.headcount = prior.headcount;
    updates.revenue = prior.revenue;
    updates.stock_price = prior.stock_price;
    updates.market_share = prior.market_share;
    updates.profit_margin = prior.profit_margin;
    updates.satisfaction = prior.satisfaction;
    updates.engagement = prior.engagement;
    updates.turnover_rate = prior.turnover_rate;
  }
  if (strategy) updates.strategy = strategy;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", teamId)
    .eq("session_id", sessionId)
    .select()
    .single();

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 500 });
  }

  return NextResponse.json({ team });
}

