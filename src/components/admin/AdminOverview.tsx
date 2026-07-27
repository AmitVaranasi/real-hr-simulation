"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Server,
  Settings,
  Users,
  LayoutDashboard,
  BookOpen,
  FunctionSquare,
  History,
  ScrollText,
} from "lucide-react";

type Counts = {
  users: number;
  sessions: number;
  teams: number;
  instructors: number;
};

export function AdminOverview() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/overview", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Failed to load overview");
          return;
        }
        if (!cancelled) setCounts(data.counts);
      } catch {
        if (!cancelled) setError("Failed to load overview");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = [
    { label: "Users", value: counts?.users, icon: Users },
    { label: "Instructors", value: counts?.instructors, icon: BookOpen },
    { label: "Sessions", value: counts?.sessions, icon: LayoutDashboard },
    { label: "Teams", value: counts?.teams, icon: Server },
  ];

  const actions = [
    {
      href: "/admin/users",
      title: "User Management",
      desc: "Roles, disable/enable, password reset, impersonation.",
      icon: Users,
    },
    {
      href: "/admin/formulas",
      title: "Formula Repository",
      desc: "Browse engine formulas and document expressions.",
      icon: FunctionSquare,
    },
    {
      href: "/admin/versions",
      title: "Version Management",
      desc: "Snapshot and restore global simulation config.",
      icon: History,
    },
    {
      href: "/admin/audit",
      title: "Audit Log",
      desc: "Administrator actions across users and config.",
      icon: ScrollText,
    },
    {
      href: "/sessions/config",
      title: "Simulation configuration",
      desc: "Edit global engine parameters.",
      icon: Settings,
    },
    {
      href: "/sessions/testing",
      title: "Testing Center",
      desc: "Run diagnostic scenarios against the engine.",
      icon: FlaskConical,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-brand)]">
          Administrator
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--portal-ink)]">
          System overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--portal-muted)]">
          Full admin console: users, formula documentation, config versions,
          audit trail, and platform diagnostics.
        </p>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[var(--portal-muted)]">
                <Icon className="h-4 w-4 text-[var(--portal-brand)]" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t.label}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-[var(--portal-ink)]">
                {t.value ?? "—"}
              </p>
            </div>
          );
        })}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-start gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm transition hover:border-[var(--portal-brand)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--portal-brand-soft)]">
                  <Icon className="h-5 w-5 text-[var(--portal-brand)]" />
                </span>
                <div>
                  <p className="font-semibold text-[var(--portal-ink)]">
                    {a.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--portal-muted)]">
                    {a.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
