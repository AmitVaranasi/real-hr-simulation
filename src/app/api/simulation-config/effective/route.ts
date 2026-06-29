import {
  mergeSimulationConfig,
  setRuntimeSimulationConfig,
  buildEffectiveConfigSnapshot,
} from "@/lib/engine/simulation-config";
import { loadSimulationConfigFromDb } from "@/lib/db/simulation-config";
import { NextResponse } from "next/server";

/** Public read-only effective config for client engine previews (no secrets). */
export async function GET() {
  const stored = await loadSimulationConfigFromDb();
  const doc = mergeSimulationConfig(stored);
  setRuntimeSimulationConfig(doc);
  const effective = buildEffectiveConfigSnapshot();
  setRuntimeSimulationConfig(null);

  return NextResponse.json({ config: doc, effective });
}
