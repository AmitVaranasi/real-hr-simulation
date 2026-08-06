"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type AdminUser = {
  id: string;
  email: string | null;
  display_name: string;
  role: "student" | "instructor" | "admin";
  created_at: string;
  disabled?: boolean;
  disabled_reason?: string | null;
};

export function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load users");
        setUsers([]);
        return;
      }
      setUsers(data.users ?? []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(userId: string, role: string) {
    setBusyId(userId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Role update failed");
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: role as AdminUser["role"] } : u
        )
      );
      setMessage("Role updated");
    } catch {
      setError("Role update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function setDisabled(user: AdminUser, disabled: boolean) {
    const reason = disabled
      ? window.prompt("Optional reason for disabling this account:")
      : null;
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          disabled,
          disabled_reason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                disabled,
                disabled_reason: disabled ? reason : null,
              }
            : u
        )
      );
      setMessage(disabled ? "User disabled" : "User re-enabled");
    } catch {
      setError("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(user: AdminUser) {
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reset failed");
        return;
      }
      setMessage(`Password reset email sent to ${user.email ?? "user"}`);
    } catch {
      setError("Reset failed");
    } finally {
      setBusyId(null);
    }
  }

  async function impersonate(user: AdminUser) {
    if (
      !window.confirm(
        `Sign in as ${user.display_name || user.email}? You can exit from the yellow banner.`
      )
    ) {
      return;
    }
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impersonation failed");
        return;
      }
      window.location.href = data.home ?? "/dashboard";
    } catch {
      setError("Impersonation failed");
      setBusyId(null);
    }
  }

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      u.display_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role.includes(q)
    );
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-primary)]">
          User Management
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--portal-ink)]">
          Accounts, roles & access
        </h1>
        <p className="mt-2 text-sm text-[var(--portal-muted)]">
          Change roles, disable accounts, send password resets, or impersonate
          for support. Registration still only offers student/instructor.
        </p>
        <input
          type="search"
          placeholder="Search name, email, or role…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-4 w-full max-w-md rounded-md border border-[var(--portal-sidebar-border)] bg-white px-3 py-2 text-sm"
        />
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
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
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-[var(--portal-muted)]">
                  Loading users…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-[var(--portal-muted)]">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--portal-sidebar-border)] last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-[var(--portal-ink)]">
                    {u.display_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--portal-muted)]">
                    {u.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-[var(--portal-sidebar-border)] bg-white px-2 py-1.5 text-sm"
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => void changeRole(u.id, e.target.value)}
                    >
                      <option value="student">student</option>
                      <option value="instructor">instructor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.disabled ? (
                      <span
                        className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                        title={u.disabled_reason ?? undefined}
                      >
                        Disabled
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id || !u.email}
                        onClick={() => void resetPassword(u)}
                      >
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id}
                        onClick={() => void setDisabled(u, !u.disabled)}
                      >
                        {u.disabled ? "Enable" : "Disable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id || !!u.disabled}
                        onClick={() => void impersonate(u)}
                      >
                        Impersonate
                      </Button>
                    </div>
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
