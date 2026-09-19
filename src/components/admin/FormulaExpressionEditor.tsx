"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { compile } from "@/lib/formula-lang";
import type { PreviewResult } from "@/lib/formula-lang/preview";

interface OverrideInfo {
  formula_id: string;
  expression_source: string;
  updated_at: string;
}

interface RevisionInfo {
  id: string;
  expression_source: string;
  note: string | null;
  created_at: string;
  source: string;
}

interface LoadResponse {
  variables: string[];
  outcomeColumn: string | null;
  override: OverrideInfo | null;
  revisions: RevisionInfo[];
}

/**
 * Self-contained expression editor for a single formula. Owns its own data
 * fetch/save/preview lifecycle so AdminFormulasClient doesn't have to thread
 * this feature's state through its own load/save cycle. All async work runs
 * inside event handlers (button clicks / the parent re-mounting this
 * component via `key={formulaId}`), never inside a useEffect — so there is
 * no setState-inside-useEffect anywhere in this file.
 */
export function FormulaExpressionEditor({
  formulaId,
  builtinExpression,
}: {
  formulaId: string;
  builtinExpression: string;
}) {
  const [loaded, setLoaded] = useState<LoadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    preview: PreviewResult;
    rowCount: number;
  } | null>(null);

  // Parent keys this component by formulaId, so a formula switch remounts
  // it fresh — this effect only ever runs once per mount, mirroring the
  // mount-only load effect in AdminFormulasClient. No setState call is
  // lexically inside the effect body itself; they all live in the named
  // loadOverride function it calls, same as that file's `load`.
  useEffect(() => {
    void loadOverride();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only, remounted by key={formulaId}
  }, []);

  async function loadOverride() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/formulas/${formulaId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "Failed to load formula");
        return;
      }
      setLoaded(data);
      setDraft(data.override?.expression_source ?? "");
      setDirty(false);
    } catch {
      setLoadError("Failed to load formula");
    } finally {
      setLoading(false);
    }
  }

  const variables = useMemo(() => loaded?.variables ?? [], [loaded]);
  const validation = useMemo(
    () => (draft.trim() ? compile(draft, variables) : null),
    [draft, variables]
  );

  async function runPreview() {
    if (!draft.trim()) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await fetch(`/api/admin/formulas/${formulaId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error ?? "Preview failed");
        return;
      }
      setPreview(data);
    } catch {
      setPreviewError("Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function save() {
    if (!draft.trim() || !validation?.ok) return;
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/formulas/${formulaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Save failed");
        return;
      }
      setSaveMessage("Formula saved as a new revision");
      await loadOverride();
    } catch {
      setSaveError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function restore() {
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/formulas/${formulaId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Restore failed");
        return;
      }
      setSaveMessage("Reverted to the built-in engine formula");
      await loadOverride();
    } catch {
      setSaveError("Restore failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">
        Loading expression editor…
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {loadError}
      </p>
    );
  }

  if (!loaded || variables.length === 0) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">
        This formula doesn&apos;t have an editable variable set configured
        yet — it can only be documented above.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--portal-sidebar-border)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--portal-ink)]">
          Live expression editor
        </p>
        {loaded.override && (
          <span className="rounded-full bg-[var(--portal-primary-soft)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--portal-primary)]">
            Overridden — last saved{" "}
            {new Date(loaded.override.updated_at).toLocaleString()}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--portal-ink)]">
          Available variables
        </p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {variables.map((v) => (
            <li
              key={v}
              className="rounded bg-[var(--portal-sidebar)] px-2 py-0.5 font-mono text-[0.6875rem] text-[var(--portal-muted)]"
            >
              {v}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-[0.6875rem] text-[var(--portal-muted)]">
          Functions: min, max, clamp(value, min, max), round(value, digits?),
          abs
        </p>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-[var(--portal-ink)]">
          Expression
        </span>
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setDirty(true);
            setSaveMessage(null);
          }}
          rows={3}
          spellCheck={false}
          placeholder={`e.g. clamp(${variables[0]} - 2, 0, 100)`}
          className="mt-1 w-full rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2 font-mono text-xs"
        />
      </label>

      {validation && !validation.ok && (
        <ul className="space-y-1 rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
          {validation.errors.map((e, i) => (
            <li key={i}>
              Column {e.col}: {e.message}
            </li>
          ))}
        </ul>
      )}
      {validation?.ok && (
        <p className="text-xs text-emerald-700">Expression is valid.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={previewLoading || !draft.trim() || validation?.ok === false}
          onClick={() => void runPreview()}
        >
          {previewLoading ? "Running preview…" : "Preview against past rounds"}
        </Button>
        <Button
          disabled={saving || !dirty || validation?.ok !== true}
          onClick={() => void save()}
        >
          Save as new revision
        </Button>
        {loaded.override && (
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => void restore()}
          >
            Restore built-in formula
          </Button>
        )}
      </div>

      {saveError && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {saveError}
        </p>
      )}
      {saveMessage && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {saveMessage}
        </p>
      )}
      {previewError && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {previewError}
        </p>
      )}

      {preview && (
        <div className="overflow-x-auto rounded-md border border-[var(--portal-sidebar-border)]">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="bg-[var(--portal-sidebar)] text-[var(--portal-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Row</th>
                <th className="px-3 py-2 font-medium">Current</th>
                <th className="px-3 py-2 font-medium">Edited</th>
                <th className="px-3 py-2 font-medium">Delta</th>
              </tr>
            </thead>
            <tbody>
              {preview.preview.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-3 text-[var(--portal-muted)]"
                  >
                    No historical rounds available to preview against yet.
                  </td>
                </tr>
              ) : (
                preview.preview.rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t border-[var(--portal-sidebar-border)]"
                  >
                    <td className="px-3 py-2">{row.label}</td>
                    <td className="px-3 py-2">
                      {row.currentValue ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.editedError ? (
                        <span className="text-red-700">{row.editedError}</span>
                      ) : (
                        (row.editedValue ?? "—")
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.delta == null
                        ? "—"
                        : (row.delta > 0 ? "+" : "") + row.delta.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[0.6875rem] text-[var(--portal-muted)]">
        Built-in reference: <span className="font-mono">{builtinExpression}</span>
      </p>
    </div>
  );
}
