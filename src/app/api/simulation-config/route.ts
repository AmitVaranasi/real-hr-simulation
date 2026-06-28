import { requireInstructor } from "@/lib/api/auth";
import {
  defaultSimulationConfig,
  mergeSimulationConfig,
  type SimulationConfigDocument,
} from "@/lib/engine/simulation-config";
import {
  loadSimulationConfigFromDb,
  saveSimulationConfigToDb,
} from "@/lib/db/simulation-config";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireInstructor();
  if (error) return error;

  const config = await loadSimulationConfigFromDb();
  return NextResponse.json({ config });
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
