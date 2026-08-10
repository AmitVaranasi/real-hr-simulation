"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  LineChart,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { REPORT_TOPICS } from "@/lib/student/help-center-content";
import {
  HelpInfoBanner,
  HelpPageHeader,
  HelpQuickLinksPanel,
  HelpSideCard,
  HelpTopicGridCard,
} from "@/components/student/help/HelpShared";

const ICONS = [
  FileText,
  FileText,
  Target,
  Users,
  LineChart,
  MessageSquare,
  TrendingUp,
  Download,
];

export function ReportsHelpView() {
  return (
    <div className="help-center pb-10">
      <HelpPageHeader
        breadcrumb="Reports & Results"
        title="Understanding Reports & Results"
        subtitle="Learn how to access, navigate, and interpret your team's results, reports, scorecards, and feedback."
      />

      <div className="mt-4">
        <HelpInfoBanner>
          The reports and analytics area helps you understand how your decisions
          are performing and where opportunities for improvement exist.
        </HelpInfoBanner>
      </div>

      <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <div className="min-w-0">
          <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
            Topics in This Section
          </h2>
          <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
            Choose a topic below to learn more about reports, results, and how to
            use them.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {REPORT_TOPICS.map((topic, i) => (
              <HelpTopicGridCard
                key={topic.number}
                number={topic.number}
                title={topic.title}
                description={topic.description}
                href={topic.href}
                icon={ICONS[i] ?? BarChart3}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-hc-card font-bold text-[var(--portal-title)]">
                  Want to See Your Results?
                </p>
                <p className="mt-1 max-w-xl text-hc-small text-[var(--portal-muted)]">
                  Go to Reports &amp; HR Analytics to explore your current round
                  reports and performance data.
                </p>
              </div>
            </div>
            <Link
              href="/reports/workforce-brief"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-hc-body font-semibold text-white hover:bg-emerald-800"
            >
              Go to Reports &amp; HR Analytics
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <HelpSideCard title="Key Takeaways" icon={CheckCircle2} accent="teal">
            <ul className="space-y-3 text-hc-small text-[var(--portal-ink)]">
              {[
                "Reports show the results of your team's decisions.",
                "Use reports to identify strengths, weaknesses, and opportunities.",
                "Review reports every round to track trends and improvement.",
                "Results help you make stronger decisions in future rounds.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </HelpSideCard>
          <HelpQuickLinksPanel />
          <HelpSideCard title="Tip" icon={Target} accent="orange">
            <p className="text-hc-small text-[var(--portal-muted)]">
              Visit the HR Metrics Reference in Resources to learn more about the
              metrics and how they are calculated.
            </p>
            <Link
              href="/resources/metrics"
              className="mt-3 inline-flex text-hc-small font-semibold text-[var(--portal-primary)] hover:underline"
            >
              Go to HR Metrics Reference →
            </Link>
          </HelpSideCard>
        </aside>
      </div>
    </div>
  );
}
