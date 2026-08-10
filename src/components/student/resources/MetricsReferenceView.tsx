"use client";

import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronRight,
  Headphones,
  ListChecks,
} from "lucide-react";
import {
  METRIC_CATEGORIES,
  ResourcesBreadcrumb,
  ResourcesContextCards,
  ResourcesFooter,
  ResourcesInfoBanner,
  ResourcesSearchRow,
  ResourcesSideCard,
  type ResourcesContext,
} from "@/components/student/resources/ResourcesShared";

export function MetricsReferenceView({
  context,
}: {
  context: ResourcesContext;
}) {
  return (
    <div className="pb-8">
      <ResourcesBreadcrumb current="HR Metrics Reference" />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-[28px] font-bold text-[var(--portal-title)]">
            HR Metrics Reference
          </h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Explore the key metrics used in the simulation. Understand what each
            metric measures, why it matters, and how it can impact your
            organization.
          </p>
        </div>
        <ResourcesContextCards context={context} />
      </div>

      <div className="mt-4">
        <ResourcesInfoBanner>
          Use these definitions to better interpret your results in the Workforce
          Brief and Reports &amp; HR Analytics.
        </ResourcesInfoBanner>
      </div>

      <div className="mt-4">
        <ResourcesSearchRow placeholder="Search metrics..." />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {METRIC_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <section
                key={cat.title}
                className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm"
              >
                <div
                  className={`flex items-center gap-2.5 px-4 py-3 text-white ${cat.header}`}
                >
                  <Icon className="h-4 w-4" />
                  <h2 className="text-sm font-bold">{cat.title}</h2>
                </div>
                <div className="p-4">
                  <p className="text-xs leading-relaxed text-[var(--portal-muted)]">
                    {cat.blurb}
                  </p>
                  <ul className="mt-3 divide-y divide-[var(--portal-sidebar-border)]">
                    {cat.metrics.map((m) => (
                      <li key={m.name}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 py-2.5 text-left hover:bg-[#f8fafc]"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-[var(--portal-title)]">
                              {m.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-[var(--portal-muted)]">
                              {m.def}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>

        <div className="space-y-4">
          <ResourcesSideCard title="How to Use This Page" icon={BookOpen}>
            <ul className="space-y-2.5">
              {[
                "Select a metric to view its full definition and guidance.",
                "Review related metrics to see how they are connected.",
                "Use this page alongside the Workforce Brief and Reports & HR Analytics.",
                "Discuss what the metrics tell you with your team each round.",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-[var(--portal-ink)]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ResourcesSideCard>

          <ResourcesSideCard title="Metric Definition Guide" icon={ListChecks}>
            <ul className="space-y-2.5">
              {[
                ["Definition", "What the metric measures."],
                ["Why It Matters", "Why this metric is important for HR strategy."],
                ["How It's Calculated", "High-level calculation logic."],
                ["What to Watch", "What changes impact this metric."],
                [
                  "Strategic Insight",
                  "Questions to consider when interpreting results.",
                ],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
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
              Visit the Simulation Reference Center for additional explanations
              on reports, budgets, and simulation features.
            </p>
          </ResourcesSideCard>
        </div>
      </div>

      <ResourcesFooter />
    </div>
  );
}
