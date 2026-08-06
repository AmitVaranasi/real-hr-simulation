"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type FormulaRow = {
  id: string;
  category: string;
  name: string;
  expression: string;
  description: string;
  sourceFile: string;
  configKeys: string[];
  expression_override: string | null;
  admin_notes: string | null;
};

const CATEGORIES = [
  "All",
  "Budget",
  "HR Metrics",
  "Financials",
  "BSC Scoring",
  "Strategy",
] as const;

export function AdminFormulasClient() {
  const [formulas, setFormulas] = useState<FormulaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exprEdit, setExprEdit] = useState("");
  const [notesEdit, setNotesEdit] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/formulas", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load formulas");
        return;
      }
      setFormulas(data.formulas ?? []);
      if (!selectedId && data.formulas?.[0]) {
        setSelectedId(data.formulas[0].id);
      }
    } catch {
      setError("Failed to load formulas");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const selected = useMemo(
    () => formulas.find((f) => f.id === selectedId) ?? null,
    [formulas, selectedId]
  );

  useEffect(() => {
    if (!selected) return;
    setExprEdit(selected.expression_override ?? selected.expression);
    setNotesEdit(selected.admin_notes ?? "");
  }, [selected]);

  const filtered = formulas.filter(
    (f) => category === "All" || f.category === category
  );

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/formulas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formulaId: selected.id,
          expression_override:
            exprEdit.trim() === selected.expression
              ? null
              : exprEdit.trim(),
          notes: notesEdit.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setMessage("Formula documentation saved");
      await load();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-primary)]">
          Formula Repository
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--portal-ink)]">
          Engine formulas & documentation
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--portal-muted)]">
          Browse the simulation formulas, annotate expression documentation, and
          tune related parameters in Configuration. Live traces run in the{" "}
          <Link
            href="/sessions/testing"
            className="font-medium text-[var(--portal-primary)] hover:underline"
          >
            Testing Center
          </Link>
          .
        </p>
      </section>

      {error && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              category === c
                ? "bg-[var(--portal-primary)] text-white"
                : "bg-[var(--portal-sidebar)] text-[var(--portal-ink)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
          {loading ? (
            <p className="p-4 text-sm text-[var(--portal-muted)]">Loading…</p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto p-2">
              {filtered.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(f.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      selectedId === f.id
                        ? "bg-[var(--portal-primary-soft)] font-semibold text-[var(--portal-primary)]"
                        : "text-[var(--portal-ink)] hover:bg-[#f4f5f7]"
                    }`}
                  >
                    <span className="block">{f.name}</span>
                    <span className="text-[11px] text-[var(--portal-muted)]">
                      {f.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          {!selected ? (
            <p className="text-sm text-[var(--portal-muted)]">
              Select a formula.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--portal-ink)]">
                  {selected.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--portal-muted)]">
                  {selected.description}
                </p>
                <p className="mt-1 text-xs text-[var(--portal-muted)]">
                  Source: {selected.sourceFile}
                </p>
              </div>

              <label className="block text-sm">
                <span className="font-medium text-[var(--portal-ink)]">
                  Expression documentation
                </span>
                <textarea
                  value={exprEdit}
                  onChange={(e) => setExprEdit(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2 font-mono text-xs"
                />
                <span className="mt-1 block text-xs text-[var(--portal-muted)]">
                  Documents the intended formula for operators. Runtime still
                  uses the TypeScript engine; change behavior via Configuration
                  parameters.
                </span>
              </label>

              <label className="block text-sm">
                <span className="font-medium text-[var(--portal-ink)]">
                  Admin notes
                </span>
                <textarea
                  value={notesEdit}
                  onChange={(e) => setNotesEdit(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2 text-sm"
                  placeholder="Pilot notes, known edge cases…"
                />
              </label>

              {selected.configKeys.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[var(--portal-ink)]">
                    Related config keys
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {selected.configKeys.map((k) => (
                      <li
                        key={k}
                        className="rounded bg-[var(--portal-sidebar)] px-2 py-0.5 font-mono text-xs text-[var(--portal-muted)]"
                      >
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button disabled={saving} onClick={() => void save()}>
                  Save documentation
                </Button>
                <Link href="/sessions/config">
                  <Button variant="outline">Edit parameters</Button>
                </Link>
                <Link href="/sessions/testing">
                  <Button variant="outline">Run live trace</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
