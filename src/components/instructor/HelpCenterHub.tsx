"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Download,
  FlaskConical,
  GraduationCap,
  LineChart,
  Rocket,
  Search,
  Wrench,
} from "lucide-react";
import {
  ProfessorPageGrid,
  ProfessorTabBar,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import { formInputClassName } from "@/components/ui/form-controls";

const CATEGORIES = [
  {
    title: "Getting Started",
    body: "Orient to the professor portal and first-week setup.",
    href: "/sessions/professor-resources/guide",
    icon: Rocket,
    wrap: "bg-emerald-600 text-white",
  },
  {
    title: "Managing My Course",
    body: "Teams, announcements, deadlines, and round controls.",
    href: "/sessions/manage",
    icon: Briefcase,
    wrap: "bg-[var(--portal-accent-blue)] text-white",
  },
  {
    title: "Understanding the Simulation",
    body: "Mechanics, scoring, and metrics.",
    href: "/sessions/professor-resources/reference",
    icon: BookOpen,
    wrap: "bg-violet-600 text-white",
  },
  {
    title: "Simulation Lab & Configuration",
    body: "Configuration, benchmarks, and diagnostics.",
    href: "/sessions/lab",
    icon: FlaskConical,
    wrap: "bg-[var(--portal-brand)] text-white",
  },
  {
    title: "Teaching & Debriefing",
    body: "Prompts and facilitation for processed rounds.",
    href: "/sessions/teaching",
    icon: GraduationCap,
    wrap: "bg-teal-600 text-white",
  },
  {
    title: "Troubleshooting & Support",
    body: "Common issues and where to get help.",
    href: "/sessions/testing",
    icon: Wrench,
    wrap: "bg-red-500 text-white",
  },
];

const TESTS = [
  ["Config under different conditions?", "Scenario Test", "/sessions/testing"],
  ["Multipliers too strong or weak?", "Multiplier Impact Test", "/sessions/testing"],
  ["Does changing one decision matter?", "Decision Sensitivity Test", "/sessions/testing"],
  ["Engine stability under extreme conditions?", "Stress Test", "/sessions/testing"],
  ["Long-term consequences of decisions?", "Carry-Forward Test", "/sessions/testing"],
  ["Own what-if questions?", "Custom Test", "/sessions/testing"],
];

const TOPICS = [
  {
    id: "start",
    label: "Getting Started",
    items: [
      {
        title: "Professor Quick Start Guide",
        body: "Create a session, add teams, and open the first practice round.",
        href: "/sessions/professor-resources/guide",
      },
      {
        title: "Course Management overview",
        body: "Teams, announcements, and rounds live under one course.",
        href: "/sessions/manage",
      },
    ],
  },
  {
    id: "course",
    label: "Course Management",
    items: [
      {
        title: "How do I create teams?",
        body: "Create a team to generate a join code. Students enroll themselves.",
        href: "/sessions/manage",
      },
      {
        title: "How do I post an announcement?",
        body: "One posted announcement appears on the student dashboard.",
        href: "/sessions/manage",
      },
    ],
  },
  {
    id: "rounds",
    label: "Round Management",
    items: [
      {
        title: "How do I process a round?",
        body: "Close the open round. Processing uses the existing engine.",
        href: "/sessions/manage",
      },
      {
        title: "Round Processing Overview",
        body: "Opening inserts default decisions. Closing computes outcomes.",
        href: "/sessions/professor-resources/guide",
      },
    ],
  },
  {
    id: "basics",
    label: "Simulation Basics",
    items: [
      {
        title: "Interpreting Student Results",
        body: "Use Industry Results and Formula Inspect for evidence.",
        href: "/sessions/class-performance",
      },
      {
        title: "Carry-forward",
        body: "Carry-forward is configured in Simulation Lab, not a second engine.",
        href: "/sessions/config",
      },
    ],
  },
  {
    id: "trouble",
    label: "Troubleshooting",
    items: [
      {
        title: "Testing Center",
        body: "Validate scenarios before applying them to a live course.",
        href: "/sessions/testing",
      },
      {
        title: "Round deadlines",
        body: "Decision windows are open or closed. Due timers are not stored.",
        href: "/sessions/manage",
      },
    ],
  },
];

export function HelpCenterHub({
  sessionId,
  courseTitle,
  engineStatus,
  roundStatus,
  teamsLabel,
}: {
  rail?: CourseRailState;
  sessionId: string | null;
  courseTitle: string;
  engineStatus: string;
  roundStatus: string;
  teamsLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("start");
  const q = query.toLowerCase();
  const filteredCategories = useMemo(
    () =>
      CATEGORIES.filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.body.toLowerCase().includes(q)
      ),
    [q]
  );
  const activeTopics =
    TOPICS.find((t) => t.id === topic)?.items.filter(
      (item) =>
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q)
    ) ?? [];

  return (
    <ProfessorPageGrid
      rail={
        <>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Need Immediate Help?
            </h2>
            <Link
              href="/sessions/professor-resources/guide"
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-[var(--portal-brand)] px-3 py-2 text-xs font-semibold text-white"
            >
              I Need Help Right Now
            </Link>
          </section>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Your Course Status
            </h2>
            <p className="mt-2 text-sm font-semibold text-[var(--portal-title)]">
              {courseTitle}
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--portal-muted)]">Configuration</dt>
                <dd>{engineStatus}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--portal-muted)]">Engine Health</dt>
                <dd>{engineStatus}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--portal-muted)]">Round Status</dt>
                <dd>{roundStatus}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--portal-muted)]">Teams</dt>
                <dd>{teamsLabel}</dd>
              </div>
            </dl>
            <Link
              href="/sessions"
              className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)]"
            >
              Go to Dashboard
            </Link>
          </section>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Quick Answers
            </h2>
            <ul className="mt-3 divide-y divide-[var(--portal-sidebar-border)] text-sm">
              {[
                ["How do I create teams?", sessionId ? `/sessions/${sessionId}/teams` : "/sessions/manage"],
                ["How do I open a round?", sessionId ? `/sessions/${sessionId}/rounds` : "/sessions/manage"],
                ["What happens if a team does not submit?", "/sessions/professor-resources/guide"],
                ["How do I process a round?", sessionId ? `/sessions/${sessionId}/rounds` : "/sessions/manage"],
                ["Can I change settings after the simulation starts?", "/sessions/config/overview"],
                ["Which test should I use?", "/sessions/testing"],
                ["How do I export results?", sessionId ? `/sessions/${sessionId}/reports` : "/sessions"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="flex items-start gap-2 py-2.5 text-[var(--portal-accent-blue)] hover:underline"
                  >
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="min-w-0 leading-snug">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/sessions/professor-resources/guide"
              className="mt-3 inline-block text-[0.8125rem] font-semibold text-[var(--portal-accent-blue)] hover:underline"
            >
              View All Quick Answers
            </Link>
          </section>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Recommended Next Steps
            </h2>
            <ul className="mt-3 space-y-3 text-sm">
              {[
                {
                  label: "Run Decision Sensitivity Test",
                  body: "after changing decision ranges.",
                  href: "/sessions/testing/sensitivity",
                  Icon: CheckCircle2,
                },
                {
                  label: "Review Round Insights",
                  body: "after processing a round.",
                  href: "/sessions/teaching/round-insights",
                  Icon: LineChart,
                },
                {
                  label: "Export Course Report",
                  body: "for your records or grading.",
                  href: sessionId ? `/sessions/${sessionId}/reports` : "/sessions",
                  Icon: Download,
                },
              ].map(({ label, body, href, Icon }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]"
                    strokeWidth={2}
                  />
                  <span className="min-w-0">
                    <Link
                      href={href}
                      className="block font-semibold text-[var(--portal-accent-blue)] hover:underline"
                    >
                      {label}
                    </Link>
                    <span className="block text-[0.75rem] text-[var(--portal-muted)]">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Contact Support
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--portal-muted)]">Email Support</dt>
                <dd>—</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--portal-muted)]">Live Chat</dt>
                <dd>—</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-[var(--portal-muted)]">
              A ticket system is not connected. Use the Professor Guide and
              Testing Center first.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 w-full rounded-md border border-[var(--portal-sidebar-border)] px-3 py-2 text-xs font-semibold text-[var(--portal-muted)]"
            >
              Create Support Ticket
            </button>
          </section>
        </>
      }
    >
      <ProfessorPageHeader
        title="Professor Help Center"
        subtitle="Find answers, guidance, and support to successfully run your simulation."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Help Center" },
        ]}
      />

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
        <input
          className={`pl-9 ${formInputClassName}`}
          placeholder="Search help articles, topics, or ask a question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {["process round", "move teams", "carry-forward", "round deadlines", "testing center"].map(
          (chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setQuery(chip)}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--portal-ink)] shadow-sm"
            >
              {chip}
            </button>
          )
        )}
      </div>

      <section>
        <h2 className="text-lg font-bold text-[var(--portal-title)]">
          How can we help you today?
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 text-center shadow-sm hover:border-[var(--portal-accent-blue)]"
              >
                <span
                  className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ${card.wrap}`}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <p className="mt-3 text-sm font-bold text-[var(--portal-title)]">
                  {i + 1}. {card.title}
                </p>
                <p className="mt-1 text-[0.8125rem] text-[var(--portal-muted)]">
                  {card.body}
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)]">
                  View Articles →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <h2 className="font-bold text-[var(--portal-title)]">
          Which test should I use?
        </h2>
        <table className="mt-3 min-w-full text-left text-sm">
          <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
            <tr>
              <th className="py-2 whitespace-nowrap">Professor Question</th>
              <th className="py-2 whitespace-nowrap">Recommended Tool</th>
            </tr>
          </thead>
          <tbody>
            {TESTS.map(([qst, tool, href]) => (
              <tr key={qst} className="border-t border-[var(--portal-sidebar-border)]">
                <td className="py-2">{qst}</td>
                <td className="py-2">
                  <Link href={href} className="font-semibold text-[var(--portal-accent-blue)]">
                    {tool}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link
          href="/sessions/testing"
          className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)]"
        >
          Go to Testing Center
        </Link>
      </section>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
        <h2 className="font-bold text-[var(--portal-title)]">Popular Help Topics</h2>
        <div className="mt-3">
          <ProfessorTabBar
            tabs={TOPICS.map((t) => ({ id: t.id, label: t.label }))}
            active={topic}
            onChange={setTopic}
          />
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {activeTopics.length === 0 ? (
            <li className="text-sm text-[var(--portal-muted)]">No matching topics.</li>
          ) : (
            activeTopics.map((item) => (
              <li key={item.title}>
                <Link href={item.href} className="block">
                  <p className="text-sm font-semibold text-[var(--portal-title)]">
                    {item.title}
                  </p>
                  <p className="text-[0.8125rem] text-[var(--portal-muted)]">
                    {item.body}
                  </p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
        <p className="text-sm text-[var(--portal-ink)]">
          Search first, then open Simulation Reference for mechanics and formulas.
        </p>
        <Link
          href="/sessions/professor-resources/reference"
          className="rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
        >
          Explore Simulation Reference
        </Link>
      </section>
    </ProfessorPageGrid>
  );
}
