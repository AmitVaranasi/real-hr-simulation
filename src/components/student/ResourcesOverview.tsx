"use client";

import Link from "next/link";
import { BarChart3, BookOpen, Check, ChevronRight, FolderOpen, GraduationCap } from "lucide-react";
import {
  ResourcesContextCards,
  ResourcesInfoBanner,
  GUIDE_META,
  REFERENCE_CARDS,
  METRIC_CATEGORIES,
  SIM_DOWNLOADS,
  COURSE_DOWNLOADS,
  type ResourcesContext,
} from "@/components/student/resources/ResourcesShared";

export function ResourcesOverview({ context }: { context: ResourcesContext }) {
  const previewDownloads = [
    ...SIM_DOWNLOADS.slice(0, 4),
    ...COURSE_DOWNLOADS.slice(0, 2).map((d) => ({
      ...d,
      icon: SIM_DOWNLOADS[0].icon,
    })),
  ];

  return (
    <div className="pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--portal-title)]">
            Resources
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--portal-muted)]">
            Explore guides, references, and tools to help you make better HR
            decisions.
          </p>
        </div>
        <ResourcesContextCards context={context} />
      </div>

      <div className="mt-4">
        <ResourcesInfoBanner>
          These resources are here to support your learning and decision-making.
          Use them to understand concepts and evaluate your options—not to find
          the &quot;right&quot; answers.
        </ResourcesInfoBanner>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[var(--portal-title)]">
                1. HR Decision Learning Guides
              </h2>
              <p className="mt-0.5 text-sm text-[var(--portal-muted)]">
                Learn the key concepts and strategic considerations for each HR
                decision area.
              </p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-[var(--portal-sidebar-border)]">
            {GUIDE_META.map((g) => {
              const Icon = g.icon;
              return (
                <li key={g.key}>
                  <Link
                    href={`/resources/learning-guides#${g.key}`}
                    className="flex items-center justify-between gap-2 py-2.5 text-sm hover:bg-[#f8fafc]"
                  >
                    <span className="inline-flex items-center gap-2.5 font-medium text-[var(--portal-ink)]">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${g.iconClass}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {g.title}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--portal-muted)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/resources/learning-guides"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-primary)] hover:underline"
          >
            View All Learning Guides →
          </Link>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[var(--portal-title)]">
                2. Simulation Reference Center
              </h2>
              <p className="mt-0.5 text-sm text-[var(--portal-muted)]">
                Understand how the simulation works and how to interpret key
                information.
              </p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-[var(--portal-sidebar-border)]">
            {REFERENCE_CARDS.map((topic) => {
              const Icon = topic.icon;
              return (
                <li key={topic.title}>
                  <Link
                    href="/resources/reference"
                    className="flex items-center justify-between gap-2 py-2.5 text-sm hover:bg-[#f8fafc]"
                  >
                    <span className="inline-flex items-center gap-2.5 font-medium text-[var(--portal-ink)]">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${topic.color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {topic.title}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--portal-muted)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/resources/reference"
            className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
          >
            Explore Reference Center →
          </Link>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-[var(--portal-purple)]">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[var(--portal-title)]">
                3. HR Metrics Reference
              </h2>
              <p className="mt-0.5 text-sm text-[var(--portal-muted)]">
                Learn what each metric means, why it matters, and how it impacts
                your organization.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {METRIC_CATEGORIES.map((g) => {
              const Icon = g.icon;
              return (
                <Link
                  key={g.title}
                  href="/resources/metrics"
                  className="rounded-lg border border-[var(--portal-sidebar-border)] px-3 py-2.5 hover:border-[var(--portal-primary)]/40"
                >
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--portal-title)]">
                    <Icon className="h-3.5 w-3.5 text-[var(--portal-purple)]" />
                    {g.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--portal-muted)]">
                    {g.metrics.map((m) => m.name).join(", ")}
                  </p>
                </Link>
              );
            })}
          </div>
          <Link
            href="/resources/metrics"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-purple)] hover:underline"
          >
            View All Metrics →
          </Link>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]">
              <FolderOpen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[var(--portal-title)]">
                4. Downloads &amp; Course Resources
              </h2>
              <p className="mt-0.5 text-sm text-[var(--portal-muted)]">
                Access important documents, templates, and resources provided by
                your instructor.
              </p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-[var(--portal-sidebar-border)]">
            {previewDownloads.map((d) => {
              const Icon = d.icon;
              return (
                <li
                  key={d.name}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="inline-flex items-center gap-2.5 font-medium text-[var(--portal-ink)]">
                    <Icon className="h-4 w-4 text-[var(--portal-brand)]" />
                    {d.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--portal-muted)]">
                    {d.type} · {d.size}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link
            href="/resources/downloads"
            className="mt-3 inline-block text-sm font-semibold text-[var(--portal-brand)] hover:underline"
          >
            View All Downloads →
          </Link>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-sidebar-border)] pt-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--portal-primary)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
        >
          ← Back to Dashboard
        </Link>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          All changes auto-saved
        </p>
        <button
          type="button"
          className="rounded-lg bg-[var(--portal-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--portal-primary-hover)]"
        >
          Save Now
        </button>
      </div>
    </div>
  );
}
