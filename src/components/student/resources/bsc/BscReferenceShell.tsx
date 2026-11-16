import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  Download,
  LayoutGrid,
  LineChart,
  Network,
  Scale,
  type LucideIcon,
} from "lucide-react";
import {
  ResourcesBreadcrumb,
  ResourcesContextCards,
  ResourcesFooter,
  type ResourcesContext,
} from "@/components/student/resources/ResourcesShared";
import {
  BSC_TABS,
  bscTabHref,
  type BscTabSlug,
} from "@/lib/student/bsc-reference";

const TAB_ICONS: Record<BscTabSlug, LucideIcon> = {
  "": LayoutGrid,
  "four-perspectives": BookOpen,
  "key-metrics": Network,
  "how-it-works": ClipboardList,
  "using-results": LineChart,
};

export function BscReferenceShell({
  active,
  context,
  children,
}: {
  active: BscTabSlug;
  context: ResourcesContext;
  children: React.ReactNode;
}) {
  const index = BSC_TABS.findIndex((t) => t.slug === active);
  const prev = BSC_TABS[index - 1];
  const next = BSC_TABS[index + 1];

  return (
    <div className="pb-8">
      <ResourcesBreadcrumb
        trail={[{ label: "Simulation Reference Center", href: "/resources/reference" }]}
        current="Understanding the HR Balance Scorecard"
      />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-2xl items-start gap-3">
          <Scale className="mt-1 h-9 w-9 shrink-0 text-[var(--portal-primary)]" aria-hidden />
          <div>
            <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--portal-title)]">
              Understanding the HR Balance Scorecard
            </h1>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              A practical guide to how the HR Balance Scorecard (BSC) measures
              performance in the Real HR Simulation.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* The guide is not written yet; never offer a download that fails. */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-muted)]"
          >
            <Download className="h-4 w-4" aria-hidden />
            Reference Guide (PDF) · Coming soon
          </button>
        </div>
      </div>

      <div className="mt-4">
        <ResourcesContextCards context={context} />
      </div>

      <nav
        aria-label="HR Balance Scorecard topics"
        className="mt-5 overflow-x-auto border-b border-[var(--portal-sidebar-border)]"
      >
        <ul className="flex min-w-max gap-1">
          {BSC_TABS.map((t) => {
            const Icon = TAB_ICONS[t.slug];
            const current = t.slug === active;
            return (
              <li key={t.slug || "overview"}>
                <Link
                  href={bscTabHref(t.slug)}
                  aria-current={current ? "page" : undefined}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold ${
                    current
                      ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
                      : "border-transparent text-[var(--portal-ink)] hover:bg-[#f8fafc]"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 space-y-5">{children}</div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-sidebar-border)] pt-4 text-sm font-semibold">
        {prev ? (
          <Link href={bscTabHref(prev.slug)} className="text-[var(--portal-primary)] hover:underline">
            ← Previous: {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={bscTabHref(next.slug)} className="text-[var(--portal-primary)] hover:underline">
            Next: {next.label} →
          </Link>
        ) : (
          <Link href="/reports/workforce-brief" className="text-[var(--portal-primary)] hover:underline">
            Open your Workforce Brief →
          </Link>
        )}
      </div>

      <ResourcesFooter
        backHref="/resources/reference"
        backLabel="Back to Simulation Reference Center"
      />
    </div>
  );
}
