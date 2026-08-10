"use client";

import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronRight,
  Headphones,
  Lightbulb,
  Star,
} from "lucide-react";
import {
  GUIDE_META,
  ResourcesBreadcrumb,
  ResourcesContextCards,
  ResourcesFooter,
  ResourcesInfoBanner,
  ResourcesSearchRow,
  ResourcesSideCard,
  type ResourcesContext,
} from "@/components/student/resources/ResourcesShared";

export function LearningGuidesView({ context }: { context: ResourcesContext }) {
  return (
    <div className="pb-8">
      <ResourcesBreadcrumb current="HR Decision Learning Guides" />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-[1.75rem] font-bold text-[var(--portal-title)]">
            HR Decision Learning Guides
          </h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Deepen your understanding of each HR decision area. Use these guides
            to explore concepts, metrics, tradeoffs, and strategic
            considerations.
          </p>
        </div>
        <ResourcesContextCards context={context} />
      </div>

      <div className="mt-4">
        <ResourcesSearchRow placeholder="Search learning guides..." />
      </div>

      <div className="mt-4">
        <ResourcesInfoBanner>
          These guides provide learning and reference support—not answers. Apply
          what you learn to make the best decisions for your organization.
        </ResourcesInfoBanner>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          {GUIDE_META.map((g, i) => {
            const Icon = g.icon;
            return (
              <Link
                key={g.key}
                id={g.key}
                href={`/learn/${g.key}`}
                className="flex items-center gap-4 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm transition hover:border-[var(--portal-primary)]/40 hover:shadow-md"
              >
                <span
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${g.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-[var(--portal-title)]">
                    {i + 1}. {g.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-[var(--portal-muted)]">
                    {g.body}
                  </p>
                  <div className="mt-3">
                    <p className="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                      Key Metrics
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {g.metrics.map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-2.5 py-1 text-[0.6875rem] font-medium text-[var(--portal-ink)]"
                        >
                          <Lightbulb className="h-3 w-3 text-[var(--portal-brand)]" />
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--portal-muted)]" />
              </Link>
            );
          })}

          <ResourcesInfoBanner>
            These guides are designed to help you think strategically. Use them
            alongside industry context, your strategy, and your team&apos;s
            goals.
          </ResourcesInfoBanner>
        </div>

        <div className="space-y-4">
          <ResourcesSideCard title="How to Use These Guides" icon={BookOpen}>
            <ul className="space-y-2.5">
              {[
                "Review a guide before making decisions in that area.",
                "Use the key concepts to understand your options.",
                "Consider the tradeoffs and how they align with your strategy.",
                "After each round, review metrics in your Workforce Brief to evaluate outcomes.",
                "Discuss insights with your team and adjust your approach for the next round.",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-[var(--portal-ink)]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ResourcesSideCard>

          <ResourcesSideCard title="What You'll Find in Each Guide" icon={Star}>
            <ul className="space-y-2.5">
              {[
                ["Core Concepts", "Key ideas and definitions"],
                ["Key Metrics", "What they mean and why they matter"],
                ["Strategic Tradeoffs", "Important choices and their implications"],
                ["Connections", "How this area impacts other HR decisions"],
                [
                  "Industry & Strategy Considerations",
                  "Questions to guide your thinking",
                ],
                ["What to Watch", "Metrics and insights in your results"],
                ["Reflection Questions", "Think like an HR leader"],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--portal-brand)]" />
                  <span>
                    <strong className="text-[var(--portal-title)]">{label}</strong>
                    {" – "}
                    {desc}
                  </span>
                </li>
              ))}
            </ul>
          </ResourcesSideCard>

          <ResourcesSideCard
            title="Need More Help?"
            icon={Headphones}
            footer={
              <Link
                href="/resources/reference"
                className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--portal-primary)] bg-white px-3 py-2 text-sm font-semibold text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
              >
                Go to Reference Center →
              </Link>
            }
          >
            <p>
              Visit the Simulation Reference Center or contact your instructor.
            </p>
          </ResourcesSideCard>
        </div>
      </div>

      <ResourcesFooter />
    </div>
  );
}
