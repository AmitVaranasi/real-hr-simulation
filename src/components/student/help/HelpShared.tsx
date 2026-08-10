"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Compass,
  FileCheck2,
  Gauge,
  Info,
  LayoutDashboard,
  LogIn,
  Map,
  Play,
  Rocket,
  Search,
  Settings,
  SlidersHorizontal,
  Star,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { HELP_QUICK_LINKS } from "@/lib/student/help-center-content";

/** Fluid type scale — shrinks with viewport so copy stays inside cards/columns. */
export const helpType = {
  pageTitle: "text-hc-title font-bold text-[var(--portal-title)]",
  sectionTitle: "text-hc-section font-bold text-[var(--portal-title)]",
  cardTitle: "text-hc-card font-bold text-[var(--portal-title)]",
  body: "text-hc-body",
  small: "text-hc-small",
  button: "text-hc-body font-semibold",
} as const;

export function HelpBreadcrumb({ current }: { current: string }) {
  return (
    <p className={`${helpType.small} font-semibold text-[var(--portal-muted)]`}>
      <Link href="/help" className="text-[var(--portal-primary)] hover:underline">
        Help Center
      </Link>
      <span className="mx-1.5">›</span>
      <span className="text-[var(--portal-title)]">{current}</span>
    </p>
  );
}

export function HelpInfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)] px-3 py-2.5 sm:px-4 sm:py-3 ${helpType.body} text-[var(--portal-ink)]`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-primary)]" />
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}

export function HelpPageHeader({
  breadcrumb,
  title,
  subtitle,
}: {
  breadcrumb?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-w-0">
      {breadcrumb ? <HelpBreadcrumb current={breadcrumb} /> : null}
      <h1 className={`${helpType.pageTitle} ${breadcrumb ? "mt-2" : ""}`}>
        {title}
      </h1>
      <p className={`mt-1 max-w-3xl ${helpType.body} text-[var(--portal-muted)]`}>
        {subtitle}
      </p>
    </div>
  );
}

const ACCENT: Record<
  string,
  { soft: string; text: string; border: string }
> = {
  blue: {
    soft: "bg-[var(--portal-primary-soft)]",
    text: "text-[var(--portal-primary)]",
    border: "border-[var(--portal-primary)]/25",
  },
  green: {
    soft: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  orange: {
    soft: "bg-[var(--portal-brand-soft)]",
    text: "text-[var(--portal-brand)]",
    border: "border-[var(--portal-brand)]/30",
  },
  purple: {
    soft: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  teal: {
    soft: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
  },
  pink: {
    soft: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
};

export function helpAccent(key: string) {
  return ACCENT[key] ?? ACCENT.blue;
}

export const HELP_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket,
  map: Map,
  sliders: SlidersHorizontal,
  chart: BarChart3,
  faq: CircleHelp,
  wrench: Wrench,
  play: Play,
  submit: FileCheck2,
  results: LayoutDashboard,
  score: Star,
  login: LogIn,
  compass: Compass,
  gauge: Gauge,
  book: BookOpen,
  search: Search,
  settings: Settings,
  alert: AlertTriangle,
  check: CheckCircle2,
};

export function HelpSideCard({
  title,
  icon,
  children,
  accent = "blue",
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  accent?: keyof typeof ACCENT;
}) {
  const Icon = icon;
  const a = helpAccent(accent);
  return (
    <div className="min-w-0 rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3 shadow-sm sm:p-5">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${a.soft} ${a.text}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <h2 className={helpType.cardTitle}>{title}</h2>
      </div>
      <div className={`mt-3 min-w-0 sm:mt-4 ${helpType.body} text-[var(--portal-ink)]`}>
        {children}
      </div>
    </div>
  );
}

export function HelpQuickLinksPanel() {
  return (
    <HelpSideCard title="Quick Links" icon={ArrowRight} accent="blue">
      <ul className="space-y-3">
        {HELP_QUICK_LINKS.map((item) => (
          <li key={item.title}>
            <Link
              href={item.href}
              className={`flex min-w-0 items-center justify-between gap-2 font-medium text-[var(--portal-title)] hover:text-[var(--portal-primary)] ${helpType.body}`}
            >
              <span className="min-w-0 break-words">{item.title}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--portal-muted)]" />
            </Link>
          </li>
        ))}
      </ul>
    </HelpSideCard>
  );
}

export function HelpAccordionItem({
  open,
  onToggle,
  icon,
  title,
  summary,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="min-w-0 rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-2.5 px-3 py-3 text-left sm:gap-3 sm:px-4 sm:py-4"
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)] text-[var(--portal-primary)] sm:h-9 sm:w-9">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block ${helpType.cardTitle}`}>{title}</span>
          <span className={`mt-1 block ${helpType.small} text-[var(--portal-muted)]`}>
            {summary}
          </span>
        </span>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-[var(--portal-muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          className={`border-t border-[var(--portal-sidebar-border)] px-3 py-3 pl-3 sm:px-4 sm:py-4 sm:pl-14 ${helpType.body} text-[var(--portal-ink)]`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function HelpTopicGridCard({
  number,
  title,
  description,
  href,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  const Icon = icon;
  return (
    <Link
      href={href}
      className="flex h-full min-w-0 flex-col rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-3 shadow-sm transition-colors hover:border-[var(--portal-primary)]/40 sm:p-4"
    >
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--portal-primary-soft)] text-[var(--portal-primary)] sm:h-12 sm:w-12">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <p className={`min-w-0 ${helpType.cardTitle}`}>
          {number}. {title}
        </p>
      </div>
      <p className={`mt-3 flex-1 ${helpType.small} text-[var(--portal-muted)]`}>
        {description}
      </p>
      <span
        className={`mt-3 inline-flex items-center gap-1 font-semibold text-[var(--portal-primary)] sm:mt-4 ${helpType.small}`}
      >
        View Topic
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
