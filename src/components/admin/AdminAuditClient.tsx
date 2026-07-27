"use client";

import { useCallback, useEffect, useState } from "react";

type AuditEntry = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export function AdminAuditClient() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/audit?limit=150", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.error && !(data.entries?.length)) {
        setError(data.error);
      }
      setEntries(data.entries ?? []);
    } catch {
      setError("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-brand)]">
          Audit log
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--portal-ink)]">
          Administrator activity
        </h1>
        <p className="mt-2 text-sm text-[var(--portal-muted)]">
          Role changes, bans, password resets, impersonation, and config
          saves/restores.
        </p>
      </section>

      {error && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--portal-sidebar-border)] bg-[var(--portal-sidebar)] text-xs uppercase tracking-wide text-[var(--portal-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Target</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-[var(--portal-muted)]">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-[var(--portal-muted)]">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[var(--portal-sidebar-border)] last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--portal-muted)]">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[var(--portal-ink)]">
                    {e.actor_name ?? e.actor_id?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--portal-ink)]">
                    {e.action}
                  </td>
                  <td className="px-4 py-3 text-[var(--portal-muted)]">
                    {[e.target_type, e.target_id?.slice(0, 12)]
                      .filter(Boolean)
                      .join(" · ") || "—"}
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
