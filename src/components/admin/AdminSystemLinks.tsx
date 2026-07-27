import Link from "next/link";
import { FlaskConical, Settings } from "lucide-react";

export function AdminSystemLinks() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-brand)]">
          System
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--portal-ink)]">
          Platform tools
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--portal-muted)]">
          Deep-links into Simulation Config and Testing Center. Also see Formula
          Repository and Version Management in the admin menu.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/sessions/config"
          className="flex items-start gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm transition hover:border-[var(--portal-brand)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--portal-brand-soft)]">
            <Settings className="h-5 w-5 text-[var(--portal-brand)]" />
          </span>
          <div>
            <p className="font-semibold text-[var(--portal-ink)]">
              Simulation Config
            </p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Global engine parameters, scenarios, and exports.
            </p>
            <p className="mt-3 text-xs font-semibold text-[var(--portal-brand)]">
              Open →
            </p>
          </div>
        </Link>
        <Link
          href="/sessions/testing"
          className="flex items-start gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm transition hover:border-[var(--portal-brand)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--portal-brand-soft)]">
            <FlaskConical className="h-5 w-5 text-[var(--portal-brand)]" />
          </span>
          <div>
            <p className="font-semibold text-[var(--portal-ink)]">
              Testing Center
            </p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Diagnostic lab for round processing and scenarios.
            </p>
            <p className="mt-3 text-xs font-semibold text-[var(--portal-brand)]">
              Open →
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
