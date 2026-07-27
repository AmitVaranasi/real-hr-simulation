"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Revision = {
  id: string;
  note: string | null;
  source: string;
  created_at: string;
  created_by: string | null;
};

export function AdminVersionsClient() {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/versions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok && data.error) {
        setError(data.error);
      } else if (data.error && !(data.revisions?.length)) {
        setError(data.error);
      }
      setRevisions(data.revisions ?? []);
    } catch {
      setError("Failed to load versions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function snapshot() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snapshot", note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Snapshot failed");
        return;
      }
      setNote("");
      setMessage("Snapshot saved");
      await load();
    } catch {
      setError("Snapshot failed");
    } finally {
      setBusy(false);
    }
  }

  async function restore(id: string) {
    if (!window.confirm("Restore this config revision as the live global config?")) {
      return;
    }
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", revisionId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Restore failed");
        return;
      }
      setMessage("Config restored — a new revision was recorded");
      await load();
    } catch {
      setError("Restore failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-brand)]">
          Version Management
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--portal-ink)]">
          Simulation config snapshots
        </h1>
        <p className="mt-2 text-sm text-[var(--portal-muted)]">
          Every save/reset from Configuration creates a revision. You can also
          take a manual snapshot and restore any prior version.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="block min-w-[220px] flex-1 text-sm">
            <span className="font-medium text-[var(--portal-ink)]">
              Snapshot note
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2"
              placeholder="e.g. Pre-pilot baseline"
            />
          </label>
          <Button disabled={busy} onClick={() => void snapshot()}>
            Take snapshot
          </Button>
          <Link href="/sessions/config">
            <Button variant="outline">Open Configuration</Button>
          </Link>
        </div>
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

      <div className="overflow-x-auto rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--portal-sidebar-border)] bg-[var(--portal-sidebar)] text-xs uppercase tracking-wide text-[var(--portal-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Note</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-[var(--portal-muted)]">
                  Loading…
                </td>
              </tr>
            ) : revisions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-[var(--portal-muted)]">
                  No revisions yet. Save config or take a snapshot.
                </td>
              </tr>
            ) : (
              revisions.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--portal-sidebar-border)] last:border-0"
                >
                  <td className="px-4 py-3 text-[var(--portal-ink)]">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 capitalize text-[var(--portal-muted)]">
                    {r.source}
                  </td>
                  <td className="px-4 py-3 text-[var(--portal-muted)]">
                    {r.note || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void restore(r.id)}
                    >
                      Restore
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
