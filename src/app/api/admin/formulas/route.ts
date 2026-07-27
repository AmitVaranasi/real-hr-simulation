import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { FORMULA_CATALOG } from "@/lib/engine/formula-catalog";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let notes: Record<
    string,
    { expression_override: string | null; notes: string | null; updated_at: string }
  > = {};

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("formula_notes")
      .select("formula_id, expression_override, notes, updated_at");
    for (const row of data ?? []) {
      notes[row.formula_id] = {
        expression_override: row.expression_override,
        notes: row.notes,
        updated_at: row.updated_at,
      };
    }
  } catch {
    notes = {};
  }

  return NextResponse.json({
    formulas: FORMULA_CATALOG.map((f) => ({
      ...f,
      expression_override: notes[f.id]?.expression_override ?? null,
      admin_notes: notes[f.id]?.notes ?? null,
      notes_updated_at: notes[f.id]?.updated_at ?? null,
    })),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: {
    formulaId?: string;
    expression_override?: string | null;
    notes?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const formulaId = body.formulaId?.trim();
  if (!formulaId || !FORMULA_CATALOG.some((f) => f.id === formulaId)) {
    return NextResponse.json({ error: "Unknown formulaId" }, { status: 400 });
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

  const row = {
    formula_id: formulaId,
    expression_override:
      body.expression_override === undefined
        ? null
        : body.expression_override?.slice(0, 2000) || null,
    notes:
      body.notes === undefined ? null : body.notes?.slice(0, 4000) || null,
    updated_by: auth.user!.id,
    updated_at: new Date().toISOString(),
  };

  // Preserve existing fields when only one is sent
  if (body.expression_override === undefined || body.notes === undefined) {
    const { data: existing } = await admin
      .from("formula_notes")
      .select("expression_override, notes")
      .eq("formula_id", formulaId)
      .maybeSingle();
    if (body.expression_override === undefined) {
      row.expression_override = existing?.expression_override ?? null;
    }
    if (body.notes === undefined) {
      row.notes = existing?.notes ?? null;
    }
  }

  const { error } = await admin.from("formula_notes").upsert(row);

  if (error) {
    return NextResponse.json(
      {
        error: error.message.includes("formula_notes")
          ? "Run migration-v6-full-admin.sql to enable formula notes"
          : error.message,
      },
      { status: 500 }
    );
  }

  await writeAdminAudit({
    actorId: auth.user!.id,
    action: "formula.note_update",
    targetType: "formula",
    targetId: formulaId,
  });

  return NextResponse.json({ ok: true });
}
