"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Factory,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Gauge,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Info,
  LineChart,
  Network,
  Scale,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { DECISION_TABS } from "@/components/portal/portal-nav";

const GUIDE_ICONS = {
  recruitment: Users,
  performance: Briefcase,
  training: GraduationCap,
  relations: HeartHandshake,
  compensation: Wallet,
  "org-design": Network,
  dei: Scale,
} as const;

const REFERENCE_TOPICS = [
  { title: "Understanding the HR Balance Scorecard", icon: Gauge },
  { title: "Understanding Industry Guidance", icon: Factory },
  { title: "Understanding Decision Impact Previews", icon: LineChart },
  { title: "Understanding Budgeting & Tradeoffs", icon: CircleDollarSign },
  { title: "Understanding Round Results", icon: BarChart3 },
  { title: "Understanding Strategy Alignment", icon: Target },
];

const METRIC_GROUPS = [
  {
    title: "Talent Acquisition Metrics",
    body: "Cost per Hire, Time to Fill, Hiring Quality",
    icon: Users,
  },
  {
    title: "Workforce & Employee Experience",
    body: "Turnover, Satisfaction, Engagement, Absenteeism",
    icon: HeartHandshake,
  },
  {
    title: "Learning & Talent Development",
    body: "Training ROI, Effectiveness, Succession Pipeline",
    icon: GraduationCap,
  },
  {
    title: "Performance Management",
    body: "Review Coverage and related quality indicators",
    icon: Briefcase,
  },
  {
    title: "Compensation & HR Financials",
    body: "Compensation Ratio, Budget Adherence, Productivity",
    icon: Wallet,
  },
  {
    title: "Workforce Inclusion",
    body: "DEI Score and inclusion-related outcomes",
    icon: Scale,
  },
];

const DOWNLOADS = [
  { name: "Student Simulation Guide", ext: "PDF", size: "1.2 MB", icon: FileText },
  { name: "HR Decision Worksheet", ext: "PDF", size: "420 KB", icon: FileText },
  { name: "Budget Planning Template", ext: "XLSX", size: "180 KB", icon: FileSpreadsheet },
  { name: "Round Checklist", ext: "PDF", size: "210 KB", icon: FileText },
  { name: "Team Collaboration Guide", ext: "PDF", size: "350 KB", icon: FileText },
  { name: "Grading & Submission Policy", ext: "PDF", size: "190 KB", icon: FileText },
];

export function ResourcesOverview({
  context,
}: {
  context: {
    roundLabel: string;
    roundOpen: boolean;
    industry: string;
    strategy: string;
    economy: string;
  };
}) {
  return (
    <div className="pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--portal-title)]">
            Resources
          </h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Explore guides, references, and tools to help you make better HR
            decisions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "Round",
              value: context.roundLabel,
              badge: context.roundOpen ? "OPEN" : null,
              icon: CalendarDays,
              iconClass: "text-[var(--portal-icon-blue)]",
            },
            {
              label: "Industry",
              value: context.industry,
              icon: Factory,
              iconClass: "text-[var(--portal-icon-green)]",
            },
            {
              label: "Strategy",
              value: context.strategy,
              icon: Target,
              iconClass: "text-[var(--portal-icon-blue)]",
            },
            {
              label: "Economy",
              value: context.economy,
              icon: Globe2,
              iconClass: "text-[var(--portal-icon-purple)]",
            },
          ].map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                className="min-w-[120px] rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2 shadow-sm"
              >
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                  <Icon className={`h-3 w-3 ${b.iconClass}`} strokeWidth={2} />
                  {b.label}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-[var(--portal-ink)]">
                  {b.value}{" "}
                  {b.badge ? (
                    <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      {b.badge}
                    </span>
                  ) : null}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--portal-accent-blue)]/25 bg-[var(--portal-accent-blue-soft)] px-4 py-3 text-sm text-[var(--portal-title)]">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]"
          strokeWidth={2}
        />
        <p>
          These resources are here to support your learning and decision-making.
          Use them to understand concepts and evaluate your options—not to find
          the &quot;right&quot; answers.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-[var(--portal-icon-blue)]">
              <BookOpen className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[var(--portal-title)]">
                1. HR Decision Learning Guides
              </h2>
              <p className="text-sm text-[var(--portal-muted)]">
                Module primers aligned to each HR decision area
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-0.5">
            {DECISION_TABS.map((t) => {
              const Icon =
                GUIDE_ICONS[t.key as keyof typeof GUIDE_ICONS] ?? Target;
              return (
                <li key={t.key}>
                  <Link
                    href={`/resources/learning-guides#${t.key}`}
                    className="flex items-center justify-between rounded-md px-2 py-2.5 text-sm hover:bg-[#f8fafc]"
                  >
                    <span className="inline-flex items-center gap-2.5 font-medium text-[var(--portal-ink)]">
                      <Icon
                        className="h-4 w-4 text-[var(--portal-icon-blue)]"
                        strokeWidth={1.75}
                      />
                      {t.label}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-slate-300"
                      strokeWidth={1.75}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/resources/learning-guides"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All Learning Guides →
          </Link>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-[var(--portal-icon-green)]">
              <BookOpen className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[var(--portal-title)]">
                2. Simulation Reference Center
              </h2>
              <p className="text-sm text-[var(--portal-muted)]">
                How the simulation mechanics and reports work
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-0.5">
            {REFERENCE_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <li key={topic.title}>
                  <Link
                    href="/resources/reference"
                    className="flex items-center justify-between rounded-md px-2 py-2.5 text-sm hover:bg-[#f8fafc]"
                  >
                    <span className="inline-flex items-center gap-2.5 font-medium text-[var(--portal-ink)]">
                      <Icon
                        className="h-4 w-4 text-[var(--portal-icon-green)]"
                        strokeWidth={1.75}
                      />
                      {topic.title}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-slate-300"
                      strokeWidth={1.75}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/resources/reference"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            Explore Reference Center →
          </Link>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-violet-50 p-2 text-[var(--portal-icon-purple)]">
              <BarChart3 className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[var(--portal-title)]">
                3. HR Metrics Reference
              </h2>
              <p className="text-sm text-[var(--portal-muted)]">
                Definitions used in The Workforce Brief
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {METRIC_GROUPS.map((g) => {
              const Icon = g.icon;
              return (
                <Link
                  key={g.title}
                  href="/resources/metrics"
                  className="rounded-lg border border-[var(--portal-sidebar-border)] px-3 py-2.5 hover:border-violet-300"
                >
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--portal-ink)]">
                    <Icon
                      className="h-3.5 w-3.5 text-[var(--portal-icon-purple)]"
                      strokeWidth={2}
                    />
                    {g.title}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--portal-muted)]">
                    {g.body}
                  </p>
                </Link>
              );
            })}
          </div>
          <Link
            href="/resources/metrics"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All Metrics →
          </Link>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--portal-primary-soft)] p-2 text-[var(--portal-primary)]">
              <FolderOpen className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[var(--portal-title)]">
                4. Downloads &amp; Course Resources
              </h2>
              <p className="text-sm text-[var(--portal-muted)]">
                Guides, worksheets, and course files
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-1">
            {DOWNLOADS.map((d) => {
              const Icon = d.icon;
              return (
                <li
                  key={d.name}
                  className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-[#f8fafc]"
                >
                  <span className="inline-flex items-center gap-2.5 font-medium text-[var(--portal-ink)]">
                    <Icon
                      className="h-4 w-4 text-[var(--portal-primary)]"
                      strokeWidth={1.75}
                    />
                    {d.name}
                  </span>
                  <span className="text-[11px] text-[var(--portal-muted)]">
                    {d.ext} · {d.size}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link
            href="/resources/downloads"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--portal-primary)] hover:underline"
          >
            View All Downloads →
          </Link>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[var(--portal-sidebar-border)] bg-white/95 backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--portal-sidebar-border)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            ← Back to Dashboard
          </Link>
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            All changes auto-saved
          </p>
          <button
            type="button"
            className="rounded-md bg-[var(--portal-accent-blue)] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save Now
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResourcesSectionPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2">
        <Link
          href="/resources"
          className="text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
        >
          ← Resources Overview
        </Link>
      </div>
      <h1 className="text-[28px] font-bold text-[var(--portal-title)]">{title}</h1>
      <p className="mt-1 text-sm text-[var(--portal-muted)]">{subtitle}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}
