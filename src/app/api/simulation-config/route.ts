import { requireInstructorOrAdmin } from "@/lib/api/auth";
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
import { writeAdminAudit } from "@/lib/admin/audit";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireInstructorOrAdmin();
  if (error) return error;

  const stored = await loadSimulationConfigFromDb();
  const config = mergeSimulationConfig(stored);
  setRuntimeSimulationConfig(config);
  const effective = buildEffectiveConfigSnapshot();
  setRuntimeSimulationConfig(null);

  return NextResponse.json({ config, effective });
}

export async function PATCH(request: Request) {
  const { error, user, profile } = await requireInstructorOrAdmin();
  if (error) return error;

  const body = await request.json();
  const merged = mergeSimulationConfig(body.config ?? body);
  const note =
    typeof body.note === "string" ? body.note.slice(0, 500) : undefined;
  await saveSimulationConfigToDb(merged, user!.id, {
    note,
    source: "save",
  });

  if (profile?.role === "admin") {
    await writeAdminAudit({
      actorId: user!.id,
      action: "config.save",
      targetType: "simulation_config",
      targetId: "global",
      meta: { note: note ?? null },
    });
  }

  return NextResponse.json({ config: merged });
}

export async function POST() {
  const { error, user, profile } = await requireInstructorOrAdmin();
  if (error) return error;

  const config = defaultSimulationConfig();
  await saveSimulationConfigToDb(config, user!.id, {
    note: "Reset to defaults",
    source: "reset",
  });

  if (profile?.role === "admin") {
    await writeAdminAudit({
      actorId: user!.id,
      action: "config.reset",
      targetType: "simulation_config",
      targetId: "global",
    });
  }

  return NextResponse.json({ config });
}
