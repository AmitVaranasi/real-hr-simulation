"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Search,
  Settings,
  Users,
} from "lucide-react";
import {
  HELP_CATEGORIES,
  HELP_POPULAR_SEARCHES,
  HELP_QUICK_LINKS,
  TECH_SUPPORT_STEPS,
} from "@/lib/student/help-center-content";
import {
  HELP_ICONS,
  HelpPageHeader,
  helpAccent,
} from "@/components/student/help/HelpShared";

export function HelpOverview() {
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_CATEGORIES;
    return HELP_CATEGORIES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.action.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="help-center pb-10">
      <HelpPageHeader
        title="Help Center"
        subtitle="Find answers, navigate the simulation, troubleshoot issues, and get support when you need it."
      />

      <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3 shadow-sm sm:p-5">
            <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
              How can we help?
            </h2>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the Help Center for articles, topics, and guides..."
                  className="w-full rounded-lg border border-[var(--portal-sidebar-border)] bg-[#f8fafc] py-2.5 pl-10 pr-3 text-hc-body text-[var(--portal-ink)] outline-none ring-[var(--portal-primary)] focus:bg-white focus:ring-2"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-[var(--portal-navy)] px-5 py-2.5 text-hc-body font-semibold text-white hover:bg-[var(--portal-title)]"
              >
                Search
              </button>
            </form>
            <p className="mt-3 text-hc-small text-[var(--portal-muted)]">
              Popular searches:{" "}
              {HELP_POPULAR_SEARCHES.map((item, i) => (
                <span key={item.label}>
                  {i > 0 ? " · " : null}
                  <Link
                    href={item.href}
                    className="font-medium text-[var(--portal-primary)] hover:underline"
                  >
                    {item.label}
                  </Link>
                </span>
              ))}
            </p>
          </section>

          <section>
            <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
              Help Center Categories
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCategories.map((cat) => {
                const Icon = HELP_ICONS[cat.iconKey] ?? BookOpen;
                const accent = helpAccent(cat.accent);
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="min-w-0 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3 shadow-sm transition-colors hover:border-[var(--portal-primary)]/40 sm:p-4"
                  >
                    <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${accent.soft} ${accent.text}`}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-hc-card font-bold text-[var(--portal-title)]">
                          {cat.title}
                        </p>
                        <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-hc-small font-semibold text-[var(--portal-primary)]">
                      {cat.action}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
              Quick Help
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {HELP_QUICK_LINKS.map((item) => {
                const Icon = HELP_ICONS[item.iconKey] ?? BookOpen;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3 shadow-sm transition-colors hover:border-[var(--portal-primary)]/40"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-2 text-hc-card font-bold text-[var(--portal-title)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
                      {item.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)] px-5 py-4">
            <div>
              <p className="text-hc-card font-bold text-[var(--portal-title)]">
                Not sure what kind of help you need?
              </p>
              <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
                Start with Frequently Asked Questions or search the Help Center
                above.
              </p>
            </div>
            <Link
              href="/help/faq"
              className="inline-flex items-center gap-1.5 text-hc-body font-semibold text-[var(--portal-primary)] hover:underline"
            >
              Browse All Help Topics
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-white p-3 shadow-sm sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 sm:h-11 sm:w-11">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-hc-card font-bold text-[var(--portal-title)]">
                  Need Help Understanding the Simulation?
                </h2>
                <p className="mt-2 text-hc-small text-[var(--portal-muted)]">
                  Real HR Simulation is designed to help you practice strategic
                  HR decision-making. Course-specific questions should go to your
                  instructor.
                </p>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2 text-hc-small text-[var(--portal-ink)] sm:grid-cols-2">
              {[
                { icon: ClipboardList, label: "Course assignments" },
                { icon: CalendarDays, label: "Simulation deadlines" },
                { icon: Users, label: "Team expectations" },
                { icon: BookOpen, label: "Required deliverables" },
                { icon: MessageSquare, label: "Classroom discussions" },
                { icon: GraduationCap, label: "Instructor requirements" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-emerald-600" />
                    {item.label}
                  </li>
                );
              })}
            </ul>
            <Link
              href="/team/instructor"
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-emerald-600 px-3 py-2 text-hc-body font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Contact Your Instructor
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                <Settings className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-hc-card font-bold text-[var(--portal-title)]">
                  Still Having a Technical Problem?
                </h2>
                <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
                  Before contacting support, try these steps:
                </p>
              </div>
            </div>
            <ol className="mt-4 space-y-2">
              {TECH_SUPPORT_STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-2 text-hc-small text-[var(--portal-ink)]">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--portal-navy)] text-[0.625rem] font-bold text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <Link
              href="/help/technical-support"
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[var(--portal-navy)] px-3 py-2.5 text-hc-body font-semibold text-white hover:bg-[var(--portal-title)]"
            >
              Report a Technical Issue
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-[#f8fafc] p-4">
            <p className="flex items-center gap-2 text-hc-card font-bold text-[var(--portal-title)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--portal-primary)]" />
              Need Immediate Help?
            </p>
            <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
              Our support team is here for you. Response time: within 1 business
              day.
            </p>
            <Link
              href="/help/technical-support"
              className="mt-3 inline-flex text-hc-small font-semibold text-[var(--portal-primary)] hover:underline"
            >
              Contact Technical Support →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
