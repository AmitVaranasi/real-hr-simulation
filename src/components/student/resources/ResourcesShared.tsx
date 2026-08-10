"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  Factory,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Gauge,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Info,
  LineChart,
  Network,
  Scale,
  Search,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ResourcesContext = {
  roundLabel: string;
  roundOpen: boolean;
  industry: string;
  strategy: string;
  economy: string;
};

export function ResourcesContextCards({ context }: { context: ResourcesContext }) {
  const items: Array<{
    label: string;
    value: string;
    badge?: string | null;
    icon: LucideIcon;
    iconClass: string;
  }> = [
    {
      label: "Round",
      value: context.roundLabel,
      badge: context.roundOpen ? "OPEN" : null,
      icon: CalendarDays,
      iconClass: "text-[var(--portal-primary)]",
    },
    {
      label: "Industry",
      value: context.industry,
      icon: Factory,
      iconClass: "text-emerald-600",
    },
    {
      label: "Strategy",
      value: context.strategy,
      icon: Target,
      iconClass: "text-[var(--portal-brand)]",
    },
    {
      label: "Economy",
      value: context.economy,
      icon: Globe2,
      iconClass: "text-[var(--portal-purple)]",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((b) => {
        const Icon = b.icon;
        return (
          <div
            key={b.label}
            className="min-w-[130px] rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-3 py-2.5 shadow-sm"
          >
            <p className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
              <Icon className={`h-3.5 w-3.5 ${b.iconClass}`} />
              {b.label}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--portal-title)]">
              {b.value}
              {b.badge ? (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[0.5625rem] font-bold text-emerald-700">
                  {b.badge}
                </span>
              ) : null}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function ResourcesInfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[var(--portal-primary)]/20 bg-[var(--portal-primary-soft)] px-4 py-3 text-sm text-[var(--portal-ink)]">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-primary)]" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export function ResourcesBreadcrumb({ current }: { current: string }) {
  return (
    <p className="text-xs font-semibold text-[var(--portal-muted)]">
      <Link href="/resources" className="text-[var(--portal-primary)] hover:underline">
        Resources
      </Link>
      <span className="mx-1.5">›</span>
      <span className="text-[var(--portal-title)]">{current}</span>
    </p>
  );
}

export function ResourcesFooter({
  backHref = "/resources",
  backLabel = "Back to Resources",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-sidebar-border)] pt-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--portal-primary)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
      >
        ← {backLabel}
      </Link>
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <Check className="h-3.5 w-3.5" />
        All changes auto-saved
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-[var(--portal-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--portal-primary-hover)]"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

export function ResourcesSearchRow({
  placeholder,
}: {
  placeholder: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
        <input
          type="search"
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--portal-sidebar-border)] bg-white py-2 pl-9 pr-3 text-sm text-[var(--portal-ink)] placeholder:text-[var(--portal-muted)] focus:border-[var(--portal-primary)] focus:outline-none"
        />
      </label>
      <button
        type="button"
        className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--portal-title)] hover:bg-[#f8fafc]"
      >
        Filter ⌄
      </button>
    </div>
  );
}

export function ResourcesSideCard({
  title,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <aside className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[var(--portal-primary)]" />
        <h3 className="text-sm font-bold text-[var(--portal-title)]">{title}</h3>
      </div>
      <div className="mt-4 space-y-3 text-xs leading-relaxed text-[var(--portal-muted)]">
        {children}
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </aside>
  );
}

export const GUIDE_META = [
  {
    key: "recruitment",
    title: "Recruitment & Selection",
    body: "Attract and select the right talent to meet your organizational needs.",
    icon: Users,
    iconClass: "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]",
    metrics: ["Cost per Hire", "Time to Fill", "Hiring Quality"],
  },
  {
    key: "performance",
    title: "Performance Management",
    body: "Set expectations, evaluate performance, and drive continuous improvement.",
    icon: Briefcase,
    iconClass: "bg-emerald-50 text-emerald-700",
    metrics: ["Review Coverage", "Productivity Index", "Performance Quality"],
  },
  {
    key: "training",
    title: "Training & Development",
    body: "Build employee capabilities and prepare your workforce for current and future success.",
    icon: GraduationCap,
    iconClass: "bg-violet-50 text-[var(--portal-purple)]",
    metrics: ["Training ROI", "Training Effectiveness", "Succession Pipeline"],
  },
  {
    key: "relations",
    title: "Employee Relations",
    body: "Foster a positive work environment and effectively manage workplace issues.",
    icon: HeartHandshake,
    iconClass: "bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]",
    metrics: ["Turnover Rate", "Employee Engagement", "Absenteeism"],
  },
  {
    key: "compensation",
    title: "Compensation & Benefits",
    body: "Design competitive and fair total rewards that attract, motivate, and retain talent.",
    icon: Wallet,
    iconClass: "bg-teal-50 text-teal-700",
    metrics: ["Compensation Ratio", "Budget Adherence", "Total Compensation"],
  },
  {
    key: "org-design",
    title: "Org Design & Change",
    body: "Structure your organization and lead change to improve agility and performance.",
    icon: Network,
    iconClass: "bg-amber-50 text-amber-700",
    metrics: ["Span of Control", "Org Effectiveness", "Change Readiness"],
  },
  {
    key: "dei",
    title: "DEI Initiatives",
    body: "Build an inclusive workplace that drives innovation, engagement, and better outcomes.",
    icon: Scale,
    iconClass: "bg-pink-50 text-pink-700",
    metrics: ["DEI Score", "Representation Index", "Inclusion Index"],
  },
] as const;

export const REFERENCE_CARDS = [
  {
    title: "Understanding the HR Balance Scorecard",
    body: "Learn how the four perspectives work together to measure organizational performance and HR's contribution.",
    learn: [
      "The four perspectives and what they measure",
      "How scores are calculated and normalized",
      "How to interpret strengths and weaknesses",
      "How HR decisions affect overall performance",
    ],
    icon: Gauge,
    color: "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]",
  },
  {
    title: "Understanding Industry Guidance & Suggested Ranges",
    body: "Learn what industry guidance means, why ranges are provided, and how to use them strategically.",
    learn: [
      "What industry guidance and ranges represent",
      "Why industries have different benchmarks",
      "What it means to be inside or outside the range",
      "How to use ranges for comparison, not targets",
    ],
    icon: LineChart,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Understanding Decision Impact Previews",
    body: "Learn how previews are generated and how to use them to anticipate potential outcomes.",
    learn: [
      "What the preview shows (and what it doesn't)",
      "Why previews are estimates, not guarantees",
      "How previews change as decisions change",
      "Tips for using previews to test your strategy",
    ],
    icon: Target,
    color: "bg-violet-50 text-[var(--portal-purple)]",
  },
  {
    title: "Understanding the HR Budget",
    body: "Understand how your discretionary HR budget works and how it connects to the overall organization.",
    learn: [
      "What the HR budget includes and excludes",
      "How budget allocation impacts performance",
      "Why HR allocations affect financial results",
      "Tips for prioritizing limited HR resources",
    ],
    icon: Wallet,
    color: "bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]",
  },
  {
    title: "Understanding The Workforce Brief",
    body: "Learn how to read and use The Workforce Brief to evaluate results and guide future decisions.",
    learn: [
      "What's included in the Workforce Brief",
      "How to interpret KPIs and summaries",
      "How to use Coaching insights",
      "How to reflect and plan with your team",
    ],
    icon: Users,
    color: "bg-sky-50 text-sky-700",
  },
  {
    title: "Understanding Financial Reports",
    body: "Learn how to read financial statements and key ratios to assess organizational performance.",
    learn: [
      "Balance Sheet – what it shows and why it matters",
      "Profit & Loss – revenues, costs, and profitability",
      "Cash Flow – cash movement and liquidity",
      "Financial Ratios – what they mean and how to use them",
    ],
    icon: FileText,
    color: "bg-red-50 text-red-600",
  },
] as const;

export const METRIC_CATEGORIES = [
  {
    title: "Talent Acquisition Metrics",
    blurb: "Measure the effectiveness and efficiency of attracting and hiring talent.",
    icon: Users,
    header: "bg-[var(--portal-primary)]",
    metrics: [
      { name: "Cost per Hire", def: "Total cost to recruit and hire one employee." },
      { name: "Time to Fill", def: "Average number of days to fill open positions." },
      {
        name: "Hiring Quality",
        def: "Quality of new hires based on performance and retention.",
      },
    ],
  },
  {
    title: "Workforce & Employee Experience",
    blurb: "Track engagement, satisfaction, and workforce stability.",
    icon: HeartHandshake,
    header: "bg-emerald-600",
    metrics: [
      {
        name: "Turnover Rate",
        def: "Percentage of employees who leave the organization during the period.",
      },
      {
        name: "Employee Engagement",
        def: "Level of employee enthusiasm and commitment.",
      },
      {
        name: "Absenteeism Rate",
        def: "Percentage of scheduled work time missed by employees.",
      },
    ],
  },
  {
    title: "Learning & Talent Development",
    blurb: "Evaluate the impact of learning and capability-building initiatives.",
    icon: GraduationCap,
    header: "bg-[var(--portal-purple)]",
    metrics: [
      { name: "Training ROI", def: "Return on investment from training programs." },
      {
        name: "Training Effectiveness",
        def: "How effective training is in improving knowledge and skills.",
      },
      {
        name: "Succession Pipeline",
        def: "Strength of internal pipeline for key roles.",
      },
    ],
  },
  {
    title: "Performance Management Metrics",
    blurb: "Assess how effectively performance is managed and drives results.",
    icon: Briefcase,
    header: "bg-teal-600",
    metrics: [
      {
        name: "Review Coverage",
        def: "Percentage of employees with completed performance reviews.",
      },
      {
        name: "Productivity Index",
        def: "Measure of employee productivity relative to targets.",
      },
      {
        name: "Performance Quality",
        def: "Quality and differentiation of performance ratings.",
      },
    ],
  },
  {
    title: "Compensation & HR Financials",
    blurb: "Monitor compensation strategy and financial stewardship.",
    icon: Wallet,
    header: "bg-[var(--portal-brand)]",
    metrics: [
      {
        name: "Compensation Ratio",
        def: "Total compensation expense as a percentage of revenue.",
      },
      {
        name: "Budget Adherence",
        def: "How well HR spending aligns with budget.",
      },
      {
        name: "Total Compensation",
        def: "Total cost of compensation for the workforce.",
      },
    ],
  },
  {
    title: "Workforce Inclusion Metrics",
    blurb: "Measure diversity, equity, and inclusion outcomes.",
    icon: Scale,
    header: "bg-red-600",
    metrics: [
      {
        name: "DEI Score",
        def: "Overall inclusion performance across key DEI dimensions.",
      },
      {
        name: "Representation Index",
        def: "Diversity of the workforce by key demographics.",
      },
      {
        name: "Inclusion Index",
        def: "Employee perception of inclusion and belonging.",
      },
    ],
  },
  {
    title: "HR Technology & Capability",
    blurb: "Evaluate technology adoption and organizational capability.",
    icon: Network,
    header: "bg-sky-700",
    metrics: [
      {
        name: "HR Tech Score",
        def: "Effectiveness of HR technology and systems.",
      },
      {
        name: "Digital Capability",
        def: "Organization's ability to leverage digital tools and data.",
      },
    ],
  },
  {
    title: "Metric Glossary",
    blurb: "Quick reference of all metrics in the simulation.",
    icon: BookOpen,
    header: "bg-slate-700",
    metrics: [
      {
        name: "A–Z Metric Glossary",
        def: "Alphabetical list of all metrics with definitions and guidance.",
      },
    ],
  },
] as const;

export const SIM_DOWNLOADS = [
  {
    name: "Student Simulation Guide",
    description:
      "Complete guide to using Real HR Simulation, including navigation, decision process, and key features.",
    type: "PDF",
    size: "1.2 MB",
    updated: "May 15, 2026",
    icon: FileText,
  },
  {
    name: "Quick Start Checklist",
    description: "Step-by-step checklist to help your team get started quickly.",
    type: "PDF",
    size: "350 KB",
    updated: "May 15, 2026",
    icon: FileText,
  },
  {
    name: "Decision Worksheet Template",
    description:
      "Worksheet to help your team analyze options and document key decisions.",
    type: "XLSX",
    size: "220 KB",
    updated: "May 15, 2026",
    icon: FileSpreadsheet,
  },
  {
    name: "Team Reflection Template",
    description:
      "Structured reflection questions to help your team learn and improve each round.",
    type: "DOCX",
    size: "180 KB",
    updated: "May 15, 2026",
    icon: FileText,
  },
] as const;

export const COURSE_DOWNLOADS = [
  {
    name: "Assignment Instructions",
    description: "Details for each assignment, deliverables, and grading rubrics.",
    type: "PDF",
    size: "210 KB",
    updated: "May 16, 2026",
  },
  {
    name: "Course Syllabus",
    description: "Course overview, schedule, policies, and expectations.",
    type: "DOCX",
    size: "980 KB",
    updated: "May 16, 2026",
  },
  {
    name: "Team Charter Template",
    description: "Template for creating your team charter and working agreements.",
    type: "XLSX",
    size: "95 KB",
    updated: "May 16, 2026",
  },
  {
    name: "Instructor Presentation Slides",
    description:
      "Slides used in class to introduce the simulation and key concepts.",
    type: "PPTX",
    size: "2.4 MB",
    updated: "May 16, 2026",
  },
  {
    name: "Grading Rubrics",
    description: "Detailed rubrics for assignments and team performance.",
    type: "PDF",
    size: "420 KB",
    updated: "May 16, 2026",
  },
  {
    name: "Reflection Journal Prompts",
    description: "Optional prompts to support individual learning and growth.",
    type: "DOCX",
    size: "150 KB",
    updated: "May 16, 2026",
  },
] as const;
