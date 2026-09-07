import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  Download,
  Filter,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  Grid3x3,
  HelpCircle,
  Library,
  Monitor,
  Search,
  Settings,
} from "lucide-react";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { formInputClassName, formSelectClassName } from "@/components/ui/form-controls";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";

export const CATEGORIES = [
  {
    title: "Professor Guide",
    body: "Step-by-step guides for setting up, running, and managing your simulation course.",
    href: "/sessions/professor-resources/guide",
    action: "View Guide",
    icon: GraduationCap,
    color: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
  },
  {
    title: "Teaching Resources",
    body: "Slides, case ideas, exercises, discussion prompts, and classroom activities.",
    href: "/sessions/professor-resources/teaching",
    action: "View Resources",
    icon: Monitor,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Simulation Reference",
    body: "Detailed references for metrics, scoring, formulas, and simulation mechanics.",
    href: "/sessions/professor-resources/reference",
    action: "View Reference",
    icon: BookOpen,
    color: "bg-violet-50 text-violet-700",
  },
  {
    title: "Downloads",
    body: "Quick access to templates, spreadsheets, rubrics, and supporting files.",
    href: "/sessions/professor-resources/downloads",
    action: "View Downloads",
    icon: Download,
    color: "bg-orange-50 text-[var(--portal-brand)]",
  },
];

const FEATURED = [
  {
    title: "Professor Getting Started Guide",
    tag: "Guide",
    href: "/sessions/professor-resources/guide",
  },
  {
    title: "Teaching Resources",
    tag: "Teaching",
    href: "/sessions/professor-resources/teaching",
  },
  {
    title: "Simulation Reference",
    tag: "Reference",
    href: "/sessions/professor-resources/reference",
  },
  {
    title: "Formula Inspect",
    tag: "Scoring",
    href: "/sessions/config",
  },
  {
    title: "Help Center",
    tag: "Support",
    href: "/sessions/help",
  },
];

export function ResourcesOverview({
  rail,
  sessionId,
}: {
  rail: CourseRailState;
  sessionId: string | null;
}) {
  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Quick Actions"
          course={rail}
          tools={[
            {
              title: "Round Management",
              icon: <CalendarDays className="h-4 w-4" strokeWidth={1.75} />,
              body: "Open, close, and process the current decision window.",
              action: "Go to Round Management",
              primary: true,
              href: sessionId
                ? `/sessions/${sessionId}/rounds`
                : "/sessions/manage",
            },
            {
              title: "Course Management",
              icon: <BookOpen className="h-4 w-4" strokeWidth={1.75} />,
              body: "Teams, announcements, and course settings.",
              action: "Open Course Management",
              href: "/sessions/manage",
            },
            {
              title: "Simulation Lab",
              icon: <FlaskConical className="h-4 w-4" strokeWidth={1.75} />,
              body: "Review configuration before students play.",
              action: "Open Simulation Lab",
              href: "/sessions/lab",
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title="Resources"
        subtitle="Access guides, teaching materials, simulation references, and downloads to support your instruction and course management."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Resources" },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 text-center shadow-sm"
            >
              <span
                className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-sm font-bold text-[var(--portal-title)]">
                {card.title}
              </h2>
              <p className="mt-1 text-[0.8125rem] text-[var(--portal-muted)]">
                {card.body}
              </p>
              <Link
                href={card.href}
                className="mt-4 inline-flex rounded-md border border-[var(--portal-accent-blue)] px-3 py-1.5 text-sm font-semibold text-[var(--portal-accent-blue)]"
              >
                {card.action}
              </Link>
            </article>
          );
        })}
      </div>

      <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="font-bold text-[var(--portal-title)]">
            Featured Resources
          </h2>
          <Link
            href="/sessions/professor-resources/downloads"
            className="text-sm font-semibold text-[var(--portal-accent-blue)]"
          >
            View All Resources
          </Link>
        </div>
        <ul>
          {FEATURED.map((item) => (
            <li
              key={item.title}
              className="flex items-center justify-between gap-3 border-t border-[var(--portal-sidebar-border)] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Library className="h-4 w-4 text-[var(--portal-muted)]" />
                <Link
                  href={item.href}
                  className="text-sm font-medium text-[var(--portal-title)] hover:underline"
                >
                  {item.title}
                </Link>
                <span className="rounded-md bg-[#eef3fb] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--portal-accent-blue)]">
                  {item.tag}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ProfessorHelpBanner
        title="Need additional resources?"
        body="Check the Professor Guide or contact support through the Help Center for assistance."
        href="/sessions/help"
        action="Go to Help Center"
      />
    </ProfessorPageGrid>
  );
}


/* The four reference cards persist across every Simulation Reference screen —
   metrics_reference_editable / professor_scoring_formulas_editable /
   professor_simulation_mechanics_editable / industry_strategy_reference_editable. */
export const REFERENCE_CARDS = [
  {
    id: "metrics",
    title: "Metrics Reference",
    body: "Complete definitions and calculations for all performance metrics.",
    href: "/sessions/professor-resources/reference/metrics",
    action: "View Metrics",
    Icon: Activity,
    tone: "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
  },
  {
    id: "formulas",
    title: "Scoring & Formulas",
    body: "Scoring logic, formulas, and weightings that drive results in the simulation.",
    href: "/sessions/professor-resources/reference/formulas",
    action: "View Formulas",
    Icon: Grid3x3,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "mechanics",
    title: "Simulation Mechanics",
    body: "How the simulation engine works including state changes and economic factors.",
    href: "/sessions/professor-resources/reference/mechanics",
    action: "View Mechanics",
    Icon: Settings,
    tone: "bg-violet-50 text-violet-600",
  },
  {
    id: "industry",
    title: "Industry & Strategy",
    body: "Industry characteristics, strategy multipliers, and competitive dynamics.",
    href: "/sessions/professor-resources/reference/industry",
    action: "View Reference",
    Icon: BarChart3,
    tone: "bg-orange-50 text-[var(--portal-brand)]",
  },
];

export function ReferenceCards({ active }: { active?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {REFERENCE_CARDS.map((c) => {
        const Icon = c.Icon;
        const isActive = c.id === active;
        return (
          <article
            key={c.id}
            className={`flex flex-col items-center rounded-xl border bg-white p-5 text-center shadow-sm ${
              isActive
                ? "border-[var(--portal-accent-blue)]"
                : "border-[var(--portal-sidebar-border)]"
            }`}
          >
            <span
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${c.tone}`}
            >
              <Icon className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <h2 className="mt-3 text-sm font-bold text-[var(--portal-title)]">
              {c.title}
            </h2>
            <p className="mb-3 mt-1 text-[0.8125rem] leading-snug text-[var(--portal-muted)]">
              {c.body}
            </p>
            <Link
              href={c.href}
              className={`mt-auto inline-flex rounded-md px-3 py-1.5 text-sm font-semibold ${
                isActive
                  ? "bg-[var(--portal-accent-blue)] text-white"
                  : "border border-[var(--portal-accent-blue)] text-[var(--portal-accent-blue)]"
              }`}
            >
              {c.action}
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export function ReferenceFilters({
  searchPlaceholder,
  selects,
}: {
  searchPlaceholder: string;
  selects: string[];
}) {
  return (
    <div className="grid items-center gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      <label className="relative block min-w-0">
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
      {selects.map((label) => (
        <select
          key={label}
          className={`${formSelectClassName} min-w-0`}
          defaultValue="all"
        >
          <option value="all">{label}</option>
        </select>
      ))}
      <button
        type="button"
        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
      >
        <Filter className="h-3.5 w-3.5" strokeWidth={2} />
        Clear Filters
      </button>
    </div>
  );
}

export function ResourceArticle({
  title,
  crumb,
  intro,
  sections,
  rail,
  activeCard,
  tabs,
  searchPlaceholder,
  filters,
  viewAllLabel,
}: {
  title: string;
  crumb: string;
  intro: string;
  sections: Array<{ heading: string; body: string; href?: string; link?: string }>;
  rail: CourseRailState;
  /** Highlights the matching reference card, as Figma does per screen. */
  activeCard?: string;
  tabs?: string[];
  searchPlaceholder?: string;
  filters?: string[];
  viewAllLabel?: string;
}) {
  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Quick Actions"
          course={rail}
          tools={[
            {
              title: "Resources Home",
              icon: <FolderOpen className="h-4 w-4" strokeWidth={1.75} />,
              body: "Return to the resource categories.",
              action: "View All Resources",
              href: "/sessions/professor-resources",
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
        subtitle={intro}
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Resources", href: "/sessions/professor-resources" },
          { label: "Simulation Reference", href: "/sessions/professor-resources/reference" },
          { label: crumb },
        ]}
      />

      {activeCard ? <ReferenceCards active={activeCard} /> : null}

      {tabs ? (
        <div className="flex w-full min-w-0 items-end gap-5 overflow-x-auto border-b border-[var(--portal-sidebar-border)]">
          {tabs.map((t, i) => (
            <span
              key={t}
              className={`relative whitespace-nowrap pb-2.5 text-sm font-semibold ${
                i === 0
                  ? "text-[var(--portal-accent-blue)]"
                  : "text-[var(--portal-muted)]"
              }`}
            >
              {t}
              {i === 0 ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t bg-[var(--portal-accent-blue)]" />
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      {filters ? (
        <ReferenceFilters
          searchPlaceholder={searchPlaceholder ?? "Search..."}
          selects={filters}
        />
      ) : null}

      <div className="space-y-3">
        {sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm"
          >
            <h2 className="font-bold text-[var(--portal-title)]">
              {section.heading}
            </h2>
            <p className="mt-2 text-sm text-[var(--portal-muted)]">
              {section.body}
            </p>
            {section.href && section.link ? (
              <Link
                href={section.href}
                className="mt-3 inline-block text-sm font-semibold text-[var(--portal-accent-blue)]"
              >
                {section.link}
              </Link>
            ) : null}
          </section>
        ))}
      </div>

      {viewAllLabel ? (
        <div className="text-center">
          <Link
            href="/sessions/help"
            className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            {viewAllLabel}
          </Link>
        </div>
      ) : null}

      <ProfessorHelpBanner
        title={`Need help understanding ${crumb.toLowerCase()}?`}
        body="Check the Professor Guide or contact support through the Help Center."
        href="/sessions/help"
        action="Go to Help Center"
      />
    </ProfessorPageGrid>
  );
}

/* professor_resources_downloads_editable: the four category cards persist, the
   active one filled; the table lists hosted files. Nothing is hosted yet, so
   the app lists its real export paths and leaves size/date as —. */
export function DownloadsView({
  rail,
  exports: exportRows,
}: {
  rail: CourseRailState;
  exports: Array<{
    name: string;
    body: string;
    category: string;
    type: string;
    href: string;
  }>;
}) {
  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Quick Actions"
          course={rail}
          tools={[
            {
              title: "Resources Home",
              icon: <FolderOpen className="h-4 w-4" strokeWidth={1.75} />,
              body: "Return to the resource categories.",
              action: "View All Resources",
              href: "/sessions/professor-resources",
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
        title="Downloads"
        subtitle="Access templates, spreadsheets, rubrics, and other files to support your instruction and course management."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Resources", href: "/sessions/professor-resources" },
          { label: "Downloads" },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const isActive = c.title === "Downloads";
          return (
            <article
              key={c.title}
              className={`flex flex-col items-center rounded-xl border bg-white p-5 text-center shadow-sm ${
                isActive
                  ? "border-[var(--portal-accent-blue)]"
                  : "border-[var(--portal-sidebar-border)]"
              }`}
            >
              <span
                className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${c.color}`}
              >
                <Icon className="h-7 w-7" strokeWidth={1.75} />
              </span>
              <h2 className="mt-3 text-sm font-bold text-[var(--portal-title)]">
                {c.title}
              </h2>
              <p className="mb-3 mt-1 text-[0.8125rem] leading-snug text-[var(--portal-muted)]">
                {c.body}
              </p>
              <Link
                href={c.href}
                className={`mt-auto inline-flex rounded-md px-3 py-1.5 text-sm font-semibold ${
                  isActive
                    ? "bg-[var(--portal-accent-blue)] text-white"
                    : "border border-[var(--portal-accent-blue)] text-[var(--portal-accent-blue)]"
                }`}
              >
                {c.action}
              </Link>
            </article>
          );
        })}
      </div>

      <ReferenceFilters
        searchPlaceholder="Search downloads by name or keyword..."
        selects={["All Categories", "All File Types"]}
      />

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="px-4 py-4">
          <h2 className="font-bold text-[var(--portal-title)]">
            All Downloads{" "}
            <span className="font-normal text-[var(--portal-muted)]">
              {exportRows.length} live exports
            </span>
          </h2>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--portal-muted)]">
            No files are hosted yet. These are the live export paths the app
            provides today.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Category</th>
                <th className="px-4 py-3 whitespace-nowrap">File Type</th>
                <th className="px-4 py-3 whitespace-nowrap">Last Updated</th>
                <th className="px-4 py-3 whitespace-nowrap">Size</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exportRows.map((row) => (
                <tr
                  key={row.name}
                  className="border-t border-[var(--portal-sidebar-border)]"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[0.5625rem] font-bold text-emerald-700">
                        {row.type}
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={row.href}
                          className="block font-semibold text-[var(--portal-title)] hover:underline"
                        >
                          {row.name}
                        </Link>
                        <span className="block text-[0.8125rem] text-[var(--portal-muted)]">
                          {row.body}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="whitespace-nowrap rounded-full bg-[var(--portal-accent-blue-soft)] px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--portal-accent-blue)]">
                      {row.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.type}</td>
                  <td className="px-4 py-3 text-[var(--portal-muted)]">—</td>
                  <td className="px-4 py-3 text-[var(--portal-muted)]">—</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={row.href}
                      className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ProfessorHelpBanner
        title="Need help finding a download?"
        body="Check the Professor Guide or contact support through the Help Center."
        href="/sessions/help"
        action="Go to Help Center"
      />
    </ProfessorPageGrid>
  );
}

