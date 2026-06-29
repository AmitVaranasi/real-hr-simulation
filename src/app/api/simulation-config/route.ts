import { requireInstructor } from "@/lib/api/auth";
import {
  defaultSimulationConfig,
  mergeSimulationConfig,
  setRuntimeSimulationConfig,
  buildEffectiveConfigSnapshot,
} from "@/lib/engine/simulation-config";
import {
  loadSimulationConfigFromDb,
  saveSimulationConfigToDb,
} from "@/lib/db/simulation-config";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireInstructor();
  if (error) return error;

  const stored = await loadSimulationConfigFromDb();
  const config = mergeSimulationConfig(stored);
  setRuntimeSimulationConfig(config);
  const effective = buildEffectiveConfigSnapshot();
  setRuntimeSimulationConfig(null);

  return NextResponse.json({ config, effective });
}

export async function PATCH(request: Request) {
  const { error, user } = await requireInstructor();
  if (error) return error;

  const body = await request.json();
  const merged = mergeSimulationConfig(body.config ?? body);
  await saveSimulationConfigToDb(merged, user!.id);
  return NextResponse.json({ config: merged });
}

export async function POST() {
  const { error, user } = await requireInstructor();
  if (error) return error;

  await saveSimulationConfigToDb(defaultSimulationConfig(), user!.id);
  return NextResponse.json({ config: defaultSimulationConfig() });
}
