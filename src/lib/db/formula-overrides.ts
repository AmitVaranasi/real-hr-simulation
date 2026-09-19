import { createAdminClient } from "@/lib/supabase/admin";

export interface FormulaOverrideRow {
  formula_id: string;
  expression_source: string;
  updated_by: string | null;
  updated_at: string;
}

export interface FormulaOverrideRevisionRow {
  id: string;
  formula_id: string;
  expression_source: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
  source: string;
}

/** All current formula overrides, keyed by formula id. Empty when the
 * migration hasn't been applied yet or nothing has been overridden. */
export async function loadFormulaOverrides(): Promise<
  Record<string, FormulaOverrideRow>
> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("formula_overrides")
      .select("formula_id, expression_source, updated_by, updated_at");
    const out: Record<string, FormulaOverrideRow> = {};
    for (const row of (data ?? []) as FormulaOverrideRow[]) {
      out[row.formula_id] = row;
    }
    return out;
  } catch {
    return {};
  }
}

export async function loadFormulaOverride(
  formulaId: string
): Promise<FormulaOverrideRow | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("formula_overrides")
      .select("formula_id, expression_source, updated_by, updated_at")
      .eq("formula_id", formulaId)
      .maybeSingle();
    return (data as FormulaOverrideRow | null) ?? null;
  } catch {
    return null;
  }
}

export async function loadFormulaOverrideRevisions(
  formulaId: string,
  limit = 20
): Promise<FormulaOverrideRevisionRow[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("formula_override_revisions")
      .select("id, formula_id, expression_source, note, created_by, created_at, source")
      .eq("formula_id", formulaId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as FormulaOverrideRevisionRow[];
  } catch {
    return [];
  }
}

/**
 * Save a new current expression for `formulaId` and append a revision, in
 * that order — mirrors saveSimulationConfigToDb's "current row, then
 * revision log" sequencing in simulation-config.ts.
 */
export async function saveFormulaOverride(
  formulaId: string,
  expressionSource: string,
  userId: string,
  opts?: { note?: string; source?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { error: upsertError } = await admin.from("formula_overrides").upsert({
    formula_id: formulaId,
    expression_source: expressionSource,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (upsertError) {
    return {
      ok: false,
      error: upsertError.message.includes("formula_overrides")
        ? "Run migration-v13-formula-editor.sql to enable the formula editor"
        : upsertError.message,
    };
  }

  try {
    await admin.from("formula_override_revisions").insert({
      formula_id: formulaId,
      expression_source: expressionSource,
      note: opts?.note ?? null,
      created_by: userId,
      source: opts?.source ?? "save",
    });
  } catch {
    // Revision log is best-effort, same as simulation_config_revisions.
  }

  return { ok: true };
}

/** Remove a formula's override, reverting it to the built-in engine formula. */
export async function clearFormulaOverride(
  formulaId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("formula_overrides")
    .delete()
    .eq("formula_id", formulaId);
  if (error) {
    return { ok: false, error: error.message };
  }
  try {
    await admin.from("formula_override_revisions").insert({
      formula_id: formulaId,
      expression_source: "",
      note: "Reverted to built-in formula",
      created_by: userId,
      source: "restore",
    });
  } catch {
    // best-effort
  }
  return { ok: true };
}
