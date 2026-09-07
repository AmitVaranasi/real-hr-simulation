import {
  Activity,
  BarChart3,
  FileText,
  Grid3x3,
  Settings,
  Filter,
  FlaskConical,
  HelpCircle,
  MoreHorizontal,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  ProfessorTabBar,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import { formInputClassName, formSelectClassName } from "@/components/ui/form-controls";

const CARD_ICONS = [Activity, Grid3x3, Settings, BarChart3];

const CARD_TONES = [
  "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
  "bg-emerald-50 text-emerald-600",
  "bg-violet-50 text-violet-600",
  "bg-orange-50 text-[var(--portal-brand)]",
];

export type LibraryItem = {
  title: string;
  body: string;
  href: string;
  category: string;
};

export function ResourceLibrary({
  title,
  subtitle,
  crumb,
  searchPlaceholder,
  cards,
  items,
  rail,
  tabs,
  activeTab,
}: {
  title: string;
  subtitle: string;
  crumb: string;
  searchPlaceholder: string;
  cards: Array<{
    title: string;
    body: string;
    href: string;
    action: string;
    countLabel: string;
  }>;
  items: LibraryItem[];
  rail: CourseRailState;
  tabs?: Array<{ id: string; label: string; href: string }>;
  activeTab?: string;
}) {
  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Quick Actions"
          course={rail}
          tools={[
            {
              title: "Simulation Lab",
              icon: <FlaskConical className="h-4 w-4" strokeWidth={1.75} />,
              body: "Inspect formulas and configuration.",
              action: "Open Simulation Lab",
              primary: true,
              href: "/sessions/lab",
            },
            {
              title: "Teaching & Debrief",
              body: "Use these materials in class.",
              action: "Open Teaching",
              href: "/sessions/teaching",
            },
            {
              title: "Help Center",
              icon: <HelpCircle className="h-4 w-4" strokeWidth={1.75} />,
              body: "Search articles and troubleshooting.",
              action: "Go to Help Center",
              href: "/sessions/help",
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Resources", href: "/sessions/professor-resources" },
          { label: crumb },
        ]}
        actions={
          <label className="relative block w-full sm:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]"
              strokeWidth={1.75}
            />
            <input
              className={`w-full pl-9 ${formInputClassName}`}
              placeholder={searchPlaceholder}
              readOnly
            />
          </label>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.title}
            className="flex flex-col items-center rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 text-center shadow-sm"
          >
            <span
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${
                CARD_TONES[cards.indexOf(card) % CARD_TONES.length]
              }`}
            >
              {(() => {
                const Glyph =
                  CARD_ICONS[cards.indexOf(card) % CARD_ICONS.length];
                return <Glyph className="h-7 w-7" strokeWidth={1.75} />;
              })()}
            </span>
            <h2 className="mt-3 text-sm font-bold text-[var(--portal-title)]">
              {card.title}
            </h2>
            <p className="mt-1 text-[0.8125rem] text-[var(--portal-muted)]">
              {card.body}
            </p>
            <p className="mb-3 mt-2 flex items-center gap-1.5 text-xs text-[var(--portal-muted)]">
              <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
              {card.countLabel}
            </p>
            <Link
              href={card.href}
              className="mt-auto inline-flex rounded-md border border-[var(--portal-accent-blue)] px-3 py-1.5 pt-1.5 text-sm font-semibold text-[var(--portal-accent-blue)]"
            >
              {card.action}
            </Link>
          </article>
        ))}
      </div>

      {tabs && activeTab ? (
        <ProfessorTabBar tabs={tabs} active={activeTab} />
      ) : null}

      <div className="grid items-end gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Category", option: "All Categories" },
          { label: "Round", option: "All Rounds" },
          { label: "Topic / HR Area", option: "All Topics" },
          { label: "Type", option: "All Types" },
        ].map(({ label, option }) => (
          <label key={label} className="block min-w-0 text-[0.75rem]">
            <span className="font-semibold text-[var(--portal-muted)]">
              {label}
            </span>
            <select className={`${formSelectClassName} mt-1 w-full`} defaultValue="all">
              <option value="all">{option}</option>
            </select>
          </label>
        ))}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={2} />
          Clear Filters
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <h2 className="font-bold text-[var(--portal-title)]">
            {title} Library{" "}
            <span className="font-normal text-[var(--portal-muted)]">
              {items.length} items
            </span>
          </h2>
          <label className="flex items-center gap-2 text-[0.8125rem] text-[var(--portal-muted)]">
            Sort by:
            <select className={formSelectClassName} defaultValue="cat">
              <option value="cat">Category (A-Z)</option>
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Reference Topic</th>
                <th className="px-4 py-3 whitespace-nowrap">Category</th>
                <th className="px-4 py-3 whitespace-nowrap">Round / Usage</th>
                <th className="px-4 py-3 whitespace-nowrap">Type</th>
                <th className="px-4 py-3 whitespace-nowrap">Last Updated</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[var(--portal-muted)]"
                  >
                    No hosted files yet. Linked destinations appear when they
                    exist in the product.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.title}
                    className="border-t border-[var(--portal-sidebar-border)]"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-start gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]">
                          <FileText className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={item.href}
                            className="block font-semibold text-[var(--portal-title)] hover:underline"
                          >
                            {item.title}
                          </Link>
                          <span className="block text-[0.8125rem] text-[var(--portal-muted)]">
                            {item.body}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[var(--portal-accent-blue-soft)] px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--portal-accent-blue)]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--portal-muted)]">
                      All Rounds
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[var(--portal-ink)]">
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Reference
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--portal-muted)]">—</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center justify-end gap-3">
                        <Link
                          href={item.href}
                          className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
                        >
                          Open
                        </Link>
                        <MoreHorizontal
                          className="h-4 w-4 text-[var(--portal-muted)]"
                          strokeWidth={2}
                        />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--portal-sidebar-border)] px-4 py-3 text-center">
          <Link
            href="/sessions/help"
            className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View All References
          </Link>
        </div>
      </section>

      <ProfessorHelpBanner
        title="Need additional resources?"
        body="Check the Help Center if a file or article is not listed here."
        href="/sessions/help"
        action="Go to Help Center"
      />
    </ProfessorPageGrid>
  );
}
