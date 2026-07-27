import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadSimulationConfigFromDb,
  saveSimulationConfigToDb,
} from "@/lib/db/simulation-config";
import { mergeSimulationConfig } from "@/lib/engine/simulation-config";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server is missing service role configuration" },
      { status: 500 }
    );
  }

  const { data, error } = await admin
    .from("simulation_config_revisions")
    .select("id, note, source, created_at, created_by, config_json")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message.includes("simulation_config_revisions")
            ? "Run migration-v6-full-admin.sql to enable version history"
            : error.message,
        revisions: [],
      },
      { status: error.message.includes("simulation_config_revisions") ? 200 : 500 }
    );
  }

  const current = await loadSimulationConfigFromDb();

  return NextResponse.json({
    current,
    revisions: (data ?? []).map((r) => ({
      id: r.id,
      note: r.note,
      source: r.source,
      created_at: r.created_at,
      created_by: r.created_by,
      // omit full json in list — fetch on restore/detail
      has_config: !!r.config_json,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: { action?: string; revisionId?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action ?? "snapshot";

  if (action === "snapshot") {
    const current = await loadSimulationConfigFromDb();
    await saveSimulationConfigToDb(current, auth.user!.id, {
      note: body.note?.slice(0, 500) || "Manual snapshot",
      source: "manual",
    });
    await writeAdminAudit({
      actorId: auth.user!.id,
      action: "config.snapshot",
      targetType: "simulation_config",
      targetId: "global",
      meta: { note: body.note ?? null },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    const revisionId = body.revisionId?.trim();
    if (!revisionId) {
      return NextResponse.json(
        { error: "revisionId is required" },
        { status: 400 }
      );
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server is missing service role configuration" },
        { status: 500 }
      );
    }

    const { data, error } = await admin
      .from("simulation_config_revisions")
      .select("config_json, note")
      .eq("id", revisionId)
      .maybeSingle();

    if (error || !data?.config_json) {
      return NextResponse.json(
        { error: "Revision not found" },
        { status: 404 }
      );
    }

    const merged = mergeSimulationConfig(data.config_json);
    await saveSimulationConfigToDb(merged, auth.user!.id, {
      note: `Restored from ${revisionId.slice(0, 8)}${data.note ? `: ${data.note}` : ""}`,
      source: "restore",
    });

    await writeAdminAudit({
      actorId: auth.user!.id,
      action: "config.restore",
      targetType: "simulation_config_revision",
      targetId: revisionId,
    });

    return NextResponse.json({ ok: true, config: merged });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
