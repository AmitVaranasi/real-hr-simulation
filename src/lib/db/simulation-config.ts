import { createAdminClient } from "@/lib/supabase/admin";
import {
  defaultSimulationConfig,
  mergeSimulationConfig,
  setRuntimeSimulationConfig,
  type SimulationConfigDocument,
} from "@/lib/engine/simulation-config";

export async function loadSimulationConfigFromDb(): Promise<SimulationConfigDocument> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("simulation_config")
      .select("config_json")
      .eq("id", "global")
      .maybeSingle();

    if (!data?.config_json) return defaultSimulationConfig();
    return mergeSimulationConfig(
      data.config_json as Partial<SimulationConfigDocument>
    );
  } catch {
    return defaultSimulationConfig();
  }
}

export async function saveSimulationConfigToDb(
  config: SimulationConfigDocument,
  userId: string,
  opts?: { note?: string; source?: string; skipRevision?: boolean }
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("simulation_config").upsert({
    id: "global",
    config_json: config,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  });

  if (!opts?.skipRevision) {
    try {
      await admin.from("simulation_config_revisions").insert({
        config_json: config,
        note: opts?.note ?? null,
        created_by: userId,
        source: opts?.source ?? "save",
      });
    } catch {
      // Table may not exist until migration-v6 is applied
    }
  }
}

export async function withSimulationConfig<T>(
  fn: () => T | Promise<T>
): Promise<T> {
  const doc = await loadSimulationConfigFromDb();
  setRuntimeSimulationConfig(doc);
  try {
    return await fn();
  } finally {
    setRuntimeSimulationConfig(null);
  }
}
