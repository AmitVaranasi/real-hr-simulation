"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Flag,
  LayoutDashboard,
  Play,
  Search,
  Users,
} from "lucide-react";
import { GETTING_STARTED_QUESTIONS } from "@/lib/student/help-center-content";
import {
  HelpAccordionItem,
  HelpInfoBanner,
  HelpPageHeader,
  HelpQuickLinksPanel,
  HelpSideCard,
} from "@/components/student/help/HelpShared";

const ICONS = [Play, ClipboardList, ArrowLeftRight, LayoutDashboard, Users, Flag];

export function GettingStartedHelpView() {
  const [openId, setOpenId] = useState<string | null>(
    GETTING_STARTED_QUESTIONS[0]?.id ?? null
  );

  return (
    <div className="help-center pb-10">
      <HelpPageHeader
        breadcrumb="Getting Started Help"
        title="Getting Started Help"
        subtitle="New to Real HR Simulation? Find answers to common questions about how to get started and what to do next."
      />

      <div className="mt-4">
        <HelpInfoBanner>
          These articles will help you understand the first steps in the
          simulation and how to prepare for your team&apos;s success.
        </HelpInfoBanner>
      </div>

      <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <div className="min-w-0 space-y-3">
          <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
            Common Questions
          </h2>
          {GETTING_STARTED_QUESTIONS.map((q, i) => {
            const Icon = ICONS[i] ?? CircleHelp;
            return (
              <div key={q.id} id={q.id}>
                <HelpAccordionItem
                  open={openId === q.id}
                  onToggle={() =>
                    setOpenId((prev) => (prev === q.id ? null : q.id))
                  }
                  icon={Icon}
                  title={q.title}
                  summary={q.summary}
                >
                  <p>{q.answer}</p>
                  {q.links.length ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {q.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-hc-body font-semibold text-[var(--portal-primary)] hover:underline"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </HelpAccordionItem>
              </div>
            );
          })}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div>
                <p className="text-hc-card font-bold text-[var(--portal-title)]">
                  Ready to Begin?
                </p>
                <p className="mt-1 max-w-xl text-hc-small text-[var(--portal-muted)]">
                  When you&apos;re ready, return to the Getting Started area to
                  continue your simulation preparation and begin your team&apos;s
                  first round.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/getting-started"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-hc-body font-semibold text-white hover:bg-emerald-800"
            >
              Go to Getting Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <HelpSideCard title="Need More Help?" icon={CircleHelp} accent="teal">
            <p className="text-hc-small text-[var(--portal-muted)]">
              If you can&apos;t find what you&apos;re looking for, we&apos;re here
              to help.
            </p>
            <ul className="mt-4 space-y-3 text-hc-body">
              <li>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 font-medium text-[var(--portal-title)] hover:text-[var(--portal-primary)]"
                >
                  <Search className="h-4 w-4 text-[var(--portal-primary)]" />
                  Search the Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/help/faq"
                  className="inline-flex items-center gap-2 font-medium text-[var(--portal-title)] hover:text-[var(--portal-primary)]"
                >
                  <CircleHelp className="h-4 w-4 text-[var(--portal-primary)]" />
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link
                  href="/help/technical-support"
                  className="inline-flex items-center gap-2 font-medium text-[var(--portal-title)] hover:text-[var(--portal-primary)]"
                >
                  Contact Technical Support
                </Link>
              </li>
            </ul>
          </HelpSideCard>
          <HelpQuickLinksPanel />
        </aside>
      </div>
    </div>
  );
}
