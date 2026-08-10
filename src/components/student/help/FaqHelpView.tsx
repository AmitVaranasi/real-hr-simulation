"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileText,
  Lightbulb,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { FAQ_QUESTIONS, FAQ_TOPICS } from "@/lib/student/help-center-content";
import {
  HelpPageHeader,
  HelpQuickLinksPanel,
  HelpSideCard,
  helpAccent,
} from "@/components/student/help/HelpShared";

const TOPIC_ICONS = {
  "getting-started": CircleHelp,
  decisions: ClipboardList,
  reports: FileText,
  team: Building2,
  technical: Settings,
  account: Shield,
} as const;

export function FaqHelpView() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(FAQ_QUESTIONS[0]?.id ?? null);

  const questions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_QUESTIONS.filter((item) => {
      if (topic && item.topic !== topic) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    });
  }, [query, topic]);

  return (
    <div className="help-center pb-10">
      <HelpPageHeader
        breadcrumb="Frequently Asked Questions"
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about the Real HR Simulation. Can't find what you need? Contact Technical Support."
      />

      <div className="mt-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions and answers..."
            className="w-full rounded-xl border border-[var(--portal-sidebar-border)] bg-white py-2.5 pl-10 pr-3 text-hc-body outline-none ring-[var(--portal-primary)] focus:ring-2"
          />
        </label>
      </div>

      <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <div className="min-w-0 space-y-5">
          <section>
            <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
              Browse by Topic
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {FAQ_TOPICS.map((t) => {
                const Icon = TOPIC_ICONS[t.id] ?? CircleHelp;
                const active = topic === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopic((prev) => (prev === t.id ? null : t.id))}
                    className={`rounded-xl border bg-white p-3 text-center shadow-sm transition-colors ${
                      active
                        ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)]"
                        : "border-[var(--portal-sidebar-border)] hover:border-[var(--portal-primary)]/40"
                    }`}
                  >
                    <span
                      className={`mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full ${helpAccent("blue").soft} ${helpAccent("blue").text}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-2 text-hc-card font-bold text-[var(--portal-title)]">
                      {t.title}
                    </p>
                    <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
                      {t.count} questions
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-hc-section font-bold text-[var(--portal-title)]">
              Top Questions
            </h2>
            <div className="mt-3 space-y-2">
              {questions.map((item) => {
                const open = openId === item.id;
                return (
                  <div
                    key={item.id}
                    id={item.id}
                    className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenId((prev) => (prev === item.id ? null : item.id))
                      }
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                      aria-expanded={open}
                    >
                      <span className="text-hc-body font-semibold text-[var(--portal-title)]">
                        {item.question}
                      </span>
                      <span className="text-[var(--portal-muted)]">
                        {open ? "⌃" : "›"}
                      </span>
                    </button>
                    {open ? (
                      <div className="border-t border-[var(--portal-sidebar-border)] px-4 py-3 text-hc-body text-[var(--portal-ink)]">
                        <p>{item.answer}</p>
                        {item.links.length ? (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {item.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="font-semibold text-[var(--portal-primary)] hover:underline"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {questions.length === 0 ? (
                <p className="text-hc-body text-[var(--portal-muted)]">
                  No matching questions. Try another search or browse by topic.
                </p>
              ) : null}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)] px-5 py-4">
            <div>
              <p className="text-hc-card font-bold text-[var(--portal-title)]">
                Still have questions?
              </p>
              <p className="mt-1 text-hc-small text-[var(--portal-muted)]">
                If you can&apos;t find the answer you&apos;re looking for, our
                support team is ready to help.
              </p>
            </div>
            <Link
              href="/help/technical-support"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--portal-navy)] px-4 py-2.5 text-hc-body font-semibold text-white hover:bg-[var(--portal-title)]"
            >
              Contact Technical Support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <HelpSideCard title="Helpful Tips" icon={CheckCircle2} accent="teal">
            <ul className="space-y-3 text-hc-small text-[var(--portal-ink)]">
              {[
                "Use the search bar to quickly find answers to common questions.",
                "Browse by topic to explore questions organized by area.",
                "Can't find what you need? Our support team is just a click away.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </HelpSideCard>
          <HelpQuickLinksPanel />
          <HelpSideCard title="Tip" icon={Lightbulb} accent="orange">
            <p className="text-hc-small text-[var(--portal-muted)]">
              For detailed explanations of metrics and calculations, visit the HR
              Metrics Reference in Resources.
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
