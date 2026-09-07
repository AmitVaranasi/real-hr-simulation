import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Info,
  Search,
} from "lucide-react";
import { formInputClassName } from "@/components/ui/form-controls";

export type CourseRailState = {
  sessionId?: string | null;
  practiceOpen?: boolean;
  competitiveRounds?: number | null;
  studentsEnrolled?: number | null;
  teamsCreated?: number | null;
  roundsCompleted?: number | null;
  nextRoundLabel?: string | null;
};

export function ProfessorCourseStatus({ state }: { state: CourseRailState }) {
  const roundsHref = state.sessionId
    ? `/sessions/${state.sessionId}/rounds`
    : "/sessions/manage";
  return (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
      <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
        Course Status
      </h2>
      <dl className="mt-3 space-y-2 text-sm">
        <Row
          label="Practice Round"
          value={
            state.practiceOpen == null
              ? "—"
              : state.practiceOpen
                ? "Open"
                : "Closed"
          }
          emphasis={state.practiceOpen ? "success" : undefined}
        />
        <Row
          label="Competitive Rounds"
          value={state.competitiveRounds != null ? String(state.competitiveRounds) : "—"}
        />
        <Row
          label="Students Enrolled"
          value={state.studentsEnrolled != null ? String(state.studentsEnrolled) : "—"}
        />
        <Row
          label="Teams Created"
          value={state.teamsCreated != null ? String(state.teamsCreated) : "—"}
        />
        <Row label="Next Round" value={state.nextRoundLabel ?? "—"} />
      </dl>
      <Link
        href={roundsHref}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--portal-accent-blue)] px-3 py-2 text-xs font-semibold text-[var(--portal-accent-blue)]"
      >
        <CalendarDays className="h-3.5 w-3.5" />
        View Round Calendar
      </Link>
    </section>
  );
}

export function ProfessorSystemStatus() {
  return (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
      <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
        System Status
      </h2>
      <dl className="mt-3 space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            <dt className="font-medium text-[var(--portal-ink)]">
              Simulation Platform
            </dt>
            <dd className="text-emerald-700">Operational</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            <dt className="font-medium text-[var(--portal-ink)]">
              Reports & Analytics
            </dt>
            <dd className="text-emerald-700">Operational</dd>
          </div>
        </div>
      </dl>
      <Link
        href="/sessions/help"
        className="mt-3 inline-block text-xs font-semibold text-[var(--portal-accent-blue)] hover:underline"
      >
        View Status Page
      </Link>
    </section>
  );
}

export function ProfessorHelpBanner({
  title,
  body,
  href = "/sessions/professor-resources/guide",
  action = "Go to Professor Guide",
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d7e4ff] bg-[#eef4ff] px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]">
          <Info className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--portal-title)]">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--portal-muted)]">{body}</p>
        </div>
      </div>
      <Link
        href={href}
        className="rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
      >
        {action}
      </Link>
    </section>
  );
}

export function ProfessorPageGrid({
  children,
  rail,
}: {
  children: ReactNode;
  rail: ReactNode;
}) {
  return (
    <div className="grid w-full min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_var(--portal-right-rail)]">
      <div className="min-w-0 overflow-x-clip space-y-5">{children}</div>
      <aside className="min-w-0 space-y-4">{rail}</aside>
    </div>
  );
}

export function ProfessorTabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; href?: string }>;
  active: string;
  onChange?: (id: string) => void;
}) {
  return (
    <div className="flex w-full min-w-0 items-end gap-5 overflow-hidden border-b border-[var(--portal-sidebar-border)]">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const className = `relative min-w-0 truncate pb-2.5 text-sm font-semibold ${
          isActive
            ? "text-[var(--portal-accent-blue)]"
            : "text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
        }`;
        const underline = isActive ? (
          <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t bg-[var(--portal-accent-blue)]" />
        ) : null;
        if (tab.href) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              {...(onChange ? { onClick: () => onChange(tab.id) } : {})}
              className={className}
            >
              {tab.label}
              {underline}
            </Link>
          );
        }
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={className}
          >
            {tab.label}
            {underline}
          </button>
        );
      })}
    </div>
  );
}

export function ProfessorFilterBar({
  search,
  onSearch,
  searchPlaceholder,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  children: ReactNode;
}) {
  return (
    // Figma gives the selects ~60% of the bar; at 50% "Sort: Round Order" clips.
    <div className="grid w-full min-w-0 grid-cols-1 items-center gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <label className="relative min-w-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]"
          strokeWidth={1.75}
        />
        <input
          className={`${formInputClassName} pl-9`}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </label>
      <div className="grid min-w-0 grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

export function ProfessorMetricStrip({
  tiles,
}: {
  tiles: Array<{
    label: string;
    value: string;
    hint?: string;
    icon: ReactNode;
    iconWrap: string;
  }>;
}) {
  return (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-2 shadow-sm">
      <div
        className={`grid gap-2 ${
          tiles.length >= 5
            ? "grid-cols-2 lg:grid-cols-5"
            : tiles.length === 4
              ? "grid-cols-2 lg:grid-cols-4"
              : "grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex items-start gap-3 rounded-lg bg-[#f4f7fb] px-3 py-3"
          >
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tile.iconWrap}`}
            >
              {tile.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold leading-none text-[var(--portal-title)]">
                {tile.value}
              </p>
              <p className="mt-1 text-[0.75rem] font-semibold text-[var(--portal-ink)]">
                {tile.label}
              </p>
              {tile.hint ? (
                <p className="mt-0.5 truncate text-[0.6875rem] text-[var(--portal-muted)]">
                  {tile.hint}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProfessorStatRow({
  tiles,
  variant = "stacked",
}: {
  tiles: Array<{
    label: string;
    value: string;
    hint?: string;
    icon?: ReactNode;
    /** Tailwind classes for the circular icon badge in the "figure" variant. */
    iconWrap?: string;
  }>;
  /**
   * "stacked" — small uppercase label above the value (Round Insights, Testing Center).
   * "figure"  — circular icon left, large figure, title-case label beneath (Teams & Enrollment).
   * Both shapes exist in the Figma set; they are not interchangeable.
   */
  variant?: "stacked" | "figure";
}) {
  const cols =
    tiles.length >= 5
      ? "grid-cols-2 lg:grid-cols-5"
      : tiles.length === 4
        ? "grid-cols-2 lg:grid-cols-4"
        : "grid-cols-2 lg:grid-cols-3";

  if (variant === "figure") {
    return (
      <div className={`grid gap-2 ${cols}`}>
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex items-center gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-4 shadow-sm"
          >
            {tile.icon ? (
              <span
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  tile.iconWrap ??
                  "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]"
                }`}
              >
                {tile.icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none text-[var(--portal-title)]">
                {tile.value}
              </p>
              <p className="mt-1.5 text-[0.8125rem] text-[var(--portal-muted)]">
                {tile.label}
              </p>
              {tile.hint ? (
                <p className="mt-0.5 text-[0.6875rem] text-[var(--portal-muted)]">
                  {tile.hint}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-2 ${cols}`}>
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-3 py-3 shadow-sm"
        >
          <p className="flex items-center gap-1.5 text-[0.5625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
            {tile.icon}
            {tile.label}
          </p>
          <p className="mt-1 text-lg font-bold leading-none text-[var(--portal-title)]">
            {tile.value}
          </p>
          {tile.hint ? (
            <p className="mt-1.5 text-[0.6875rem] text-[var(--portal-muted)]">
              {tile.hint}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export type ToolAction = {
  title: string;
  body: string;
  href?: string;
  action: string;
  onClick?: () => void;
  primary?: boolean;
  /** Figma pairs every rail item with an icon; pass the lucide glyph. */
  icon?: ReactNode;
};

export function ProfessorToolsRail({
  title,
  items,
}: {
  title: string;
  items: ToolAction[];
}) {
  return (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
      <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
        {title}
      </h2>
      <ul className="mt-3 space-y-4">
        {items.map((item, i) => (
          <li
            key={item.title}
            className={i > 0 ? "border-t border-[var(--portal-sidebar-border)] pt-4" : ""}
          >
            <div className="flex items-start gap-2.5">
              {item.icon ? (
                <span className="mt-0.5 shrink-0 text-[var(--portal-accent-blue)]">
                  {item.icon}
                </span>
              ) : null}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--portal-title)]">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-[var(--portal-muted)]">
                  {item.body}
                </p>
              </div>
            </div>
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className={`mt-2 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-xs font-semibold ${
                  item.primary
                    ? "bg-[var(--portal-brand)] text-white"
                    : "border border-[var(--portal-accent-blue)] text-[var(--portal-accent-blue)]"
                }`}
              >
                {item.action}
              </button>
            ) : (
              <Link
                href={item.href ?? "#"}
                className={`mt-2 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-xs font-semibold ${
                  item.primary
                    ? "bg-[var(--portal-brand)] text-white"
                    : "border border-[var(--portal-accent-blue)] text-[var(--portal-accent-blue)]"
                }`}
              >
                {item.action}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProfessorStandardRail({
  toolsTitle,
  tools,
  course,
}: {
  toolsTitle: string;
  tools: ToolAction[];
  course: CourseRailState;
}) {
  return (
    <>
      <ProfessorToolsRail title={toolsTitle} items={tools} />
      <ProfessorCourseStatus state={course} />
      <ProfessorSystemStatus />
    </>
  );
}

export function dash(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

/** "1 Team" / "2 Teams" — Figma never shows "1 Teams". */
export function plural(
  count: number | null | undefined,
  singular: string,
  pluralForm = `${singular}s`
) {
  if (count == null) return "—";
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Figma's list-row pattern: icon + title + description + chevron.
 * Used for rail sub-lists, teaching prompts, discussion starters and quick tools.
 */
export function ProfessorListRow({
  icon,
  title,
  body,
  href,
  trailing,
  bordered = true,
}: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  href?: string;
  trailing?: ReactNode;
  bordered?: boolean;
}) {
  const inner = (
    <>
      {icon ? (
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--portal-title)]">
          {title}
        </span>
        {body ? (
          <span className="mt-0.5 block text-[0.75rem] leading-snug text-[var(--portal-muted)]">
            {body}
          </span>
        ) : null}
      </span>
      {trailing ?? (
        href ? (
          <ChevronRight
            className="mt-1.5 h-4 w-4 shrink-0 text-[var(--portal-muted)]"
            strokeWidth={2}
          />
        ) : null
      )}
    </>
  );
  const className = `flex items-start gap-3 ${
    bordered
      ? "rounded-lg border border-[var(--portal-sidebar-border)] px-3 py-2.5"
      : "py-2.5"
  }`;
  if (href) {
    return (
      <Link href={href} className={`${className} hover:bg-[#f8fafc]`}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: "success";
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[var(--portal-muted)]">{label}</dt>
      <dd
        className={`font-medium ${
          emphasis === "success" ? "text-emerald-700" : "text-[var(--portal-ink)]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
