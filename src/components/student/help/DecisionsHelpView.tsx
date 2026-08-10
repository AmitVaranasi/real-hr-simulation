"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  DollarSign,
  FileCheck2,
  Lightbulb,
  Save,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { DECISION_TOPICS } from "@/lib/student/help-center-content";
import {
  HelpInfoBanner,
  HelpPageHeader,
  HelpQuickLinksPanel,
  HelpSideCard,
  HelpTopicGridCard,
} from "@/components/student/help/HelpShared";

const ICONS = [
  ClipboardList,
  SlidersHorizontal,
  Target,
  AlertTriangle,
  DollarSign,
  Save,
  FileCheck2,
  ArrowLeftRight,
];

export function DecisionsHelpView() {
  return (
    <div className="help-center pb-10">
      <HelpPageHeader
        breadcrumb="Making HR Decisions"
        title="Making HR Decisions Help"
        subtitle="Learn how to use the decision interface, understand key features, and get guidance on entering, saving, and reviewing your team's decisions."
      />

      <div className="mt-4">
        <HelpInfoBanner>
          This section explains how the decision system works. For guidance on
          strategy and concepts, visit the HR Decision Learning Guides in
          Resources.
        </HelpInfoBanner>
      </div>

      <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <div className="min-w-0">
          <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
            Topics in This Section
          </h2>
          <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
            Choose a topic below to learn more about the decision process and
            interface.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {DECISION_TOPICS.map((topic, i) => (
              <HelpTopicGridCard
                key={topic.number}
                number={topic.number}
                title={topic.title}
                description={topic.description}
                href={topic.href}
                icon={ICONS[i] ?? ClipboardList}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                <CircleHelp className="h-5 w-5" />
              </span>
              <div>
                <p className="text-hc-card font-bold text-[var(--portal-title)]">
                  Need Conceptual Guidance?
                </p>
                <p className="mt-1 max-w-xl text-hc-small text-[var(--portal-muted)]">
                  For strategies, best practices, and deeper HR concepts, visit
                  the HR Decision Learning Guides in Resources.
                </p>
              </div>
            </div>
            <Link
              href="/resources/learning-guides"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--portal-navy)] px-4 py-2.5 text-hc-body font-semibold text-white hover:bg-[var(--portal-title)]"
            >
              Go to HR Decision Learning Guides
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <HelpSideCard title="Remember" icon={Lightbulb} accent="orange">
            <p className="text-hc-small text-[var(--portal-muted)]">
              This section explains how the decision interface works.
            </p>
            <ul className="mt-3 space-y-2 text-hc-small text-[var(--portal-ink)]">
              {[
                "It does not recommend what decisions you should make.",
                "Focus on how the tools work.",
                "Use the learning guides for strategy and HR concepts.",
                "Your choices, trade-offs, and judgment drive your results.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </HelpSideCard>
          <HelpQuickLinksPanel />
        </aside>
      </div>
    </div>
  );
}
