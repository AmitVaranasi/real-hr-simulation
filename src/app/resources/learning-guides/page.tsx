import Link from "next/link";
import { ResourcesSectionPage } from "@/components/student/ResourcesOverview";
import {
  PRE_SIM_MODULES,
  type PreSimSlug,
} from "@/lib/student/pre-sim-content";
import { DECISION_TABS } from "@/components/portal/portal-nav";

export default function LearningGuidesPage() {
  return (
    <ResourcesSectionPage
      title="HR Decision Learning Guides"
      subtitle="Use these primers before and during each decision module. Deeper second-layer articles will expand as Dr. Cooper finalizes content."
    >
      {DECISION_TABS.map((tab) => {
        const content = PRE_SIM_MODULES[tab.key as PreSimSlug];
        return (
          <section
            key={tab.key}
            id={tab.key}
            className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-bold text-[var(--portal-title)]">
              {content?.title ?? tab.label}
            </h2>
            <p className="mt-1 text-sm font-medium text-[var(--portal-muted)]">
              {content?.subtitle}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--portal-ink)]">
              {content?.intro}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/learn/${tab.key}`}
                className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
              >
                Open full learning guide →
              </Link>
              <Link
                href={`/dashboard`}
                className="text-sm font-semibold text-[var(--portal-primary)] hover:underline"
              >
                Return to decisions from Dashboard →
              </Link>
            </div>
          </section>
        );
      })}
    </ResourcesSectionPage>
  );
}
