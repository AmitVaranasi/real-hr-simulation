import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { writeAdminAudit } from "@/lib/admin/audit";
import { formulaById } from "@/lib/engine/formula-catalog";
import { engineVariablesFor } from "@/lib/formula-lang/engine-variables";
import { compile } from "@/lib/formula-lang/index";
import {
  clearFormulaOverride,
  loadFormulaOverride,
  loadFormulaOverrideRevisions,
  saveFormulaOverride,
} from "@/lib/db/formula-overrides";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const catalogEntry = formulaById(id);
  if (!catalogEntry) {
    return NextResponse.json({ error: "Unknown formulaId" }, { status: 404 });
  }
  const spec = engineVariablesFor(id);

  const [override, revisions] = await Promise.all([
    loadFormulaOverride(id),
    loadFormulaOverrideRevisions(id),
  ]);

  return NextResponse.json({
    formula: catalogEntry,
    variables: spec?.variables ?? [],
    outcomeColumn: spec?.outcomeColumn ?? null,
    override,
    revisions,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const catalogEntry = formulaById(id);
  if (!catalogEntry) {
    return NextResponse.json({ error: "Unknown formulaId" }, { status: 404 });
  }
  const spec = engineVariablesFor(id);
  if (!spec) {
    return NextResponse.json(
      { error: "This formula does not have an editable variable set yet" },
      { status: 400 }
    );
  }

  let body: { expression?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expression = body.expression?.trim();
  if (!expression) {
    return NextResponse.json({ error: "expression is required" }, { status: 400 });
  }

  const compiled = compile(expression, spec.variables);
  if (!compiled.ok) {
    return NextResponse.json(
      { error: "Expression is invalid", issues: compiled.errors },
      { status: 400 }
    );
  }

  const result = await saveFormulaOverride(id, expression, auth.user!.id, {
    note: body.note,
    source: "save",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await writeAdminAudit({
    actorId: auth.user!.id,
    action: "formula.override_save",
    targetType: "formula",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  if (!formulaById(id)) {
    return NextResponse.json({ error: "Unknown formulaId" }, { status: 404 });
  }

  const result = await clearFormulaOverride(id, auth.user!.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await writeAdminAudit({
    actorId: auth.user!.id,
    action: "formula.override_restore",
    targetType: "formula",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
