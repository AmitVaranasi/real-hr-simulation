import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { formulaById } from "@/lib/engine/formula-catalog";
import { engineVariablesFor } from "@/lib/formula-lang/engine-variables";
import { buildPreview } from "@/lib/formula-lang/preview";
import { fetchPreviewRows } from "@/lib/db/formula-preview-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  if (!formulaById(id)) {
    return NextResponse.json({ error: "Unknown formulaId" }, { status: 404 });
  }
  const spec = engineVariablesFor(id);
  if (!spec) {
    return NextResponse.json(
      { error: "This formula does not have an editable variable set yet" },
      { status: 400 }
    );
  }

  let body: { expression?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expression = body.expression?.trim();
  if (!expression) {
    return NextResponse.json({ error: "expression is required" }, { status: 400 });
  }

  const rows = await fetchPreviewRows(id);
  const preview = buildPreview(expression, spec.variables, rows);

  return NextResponse.json({ preview, rowCount: rows.length });
}
