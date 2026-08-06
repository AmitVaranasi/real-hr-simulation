import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Home,
  Gauge,
  ClipboardList,
  FileCheck2,
  BarChart3,
  Trophy,
  BookOpen,
  LineChart,
  Search,
  Settings,
  FlaskConical,
  Users,
  Shield,
  Server,
  UserPlus,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  Wallet,
  FunctionSquare,
  History,
  ScrollText,
  Building2,
  Library,
  CircleHelp,
  Network,
  Scale,
  MessageSquare,
  Mail,
  FileText,
  Landmark,
  Download,
  Megaphone,
  CalendarDays,
  Presentation,
  Lightbulb,
  FolderOpen,
  IdCard,
} from "lucide-react";

export type PortalNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  match?: (pathname: string, search: string) => boolean;
  children?: PortalNavItem[];
  /** When true, children render expanded by default on related routes */
  defaultExpanded?: boolean;
};

export const DECISION_TABS = [
  {
    key: "recruitment",
    label: "Recruitment & Selection",
    index: 0,
    icon: UserPlus,
    shrm: "Talent Acquisition",
  },
  {
    key: "performance",
    label: "Performance Management",
    index: 1,
    icon: Briefcase,
    shrm: "Performance Management",
  },
  {
    key: "training",
    label: "Training & Development",
    index: 2,
    icon: GraduationCap,
    shrm: "Learning & Development",
  },
  {
    key: "relations",
    label: "Employee Relations",
    index: 3,
    icon: HeartHandshake,
    shrm: "Employee & Labor Relations",
  },
  {
    key: "compensation",
    label: "Compensation & Benefits",
    index: 4,
    icon: Wallet,
    shrm: "Total Rewards",
  },
  {
    key: "org-design",
    label: "Org Design & Change",
    index: 5,
    icon: Network,
    shrm: "Organization",
  },
  {
    key: "dei",
    label: "DEI Initiatives",
    index: 6,
    icon: Scale,
    shrm: "Diversity, Equity & Inclusion",
  },
] as const;

export type DecisionTabKey = (typeof DECISION_TABS)[number]["key"];

export function studentNavItems(opts: {
  openRoundId: string | null;
}): PortalNavItem[] {
  const { openRoundId } = opts;
  // Stable entry routes resolve the open round server-side.
  // Prefer direct round URLs when we already know the open round id.
  const decisionBase = openRoundId
    ? `/round/${openRoundId}/decisions`
    : "/decisions";
  const reviewHref = openRoundId
    ? `/round/${openRoundId}/review`
    : "/review";

  return [
    {
      href: "/dashboard/getting-started",
      label: "Getting Started",
      icon: Home,
      match: (p) => p.startsWith("/dashboard/getting-started"),
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Gauge,
      match: (p) => p === "/dashboard",
    },
    {
      href: decisionBase,
      label: "HR Decisions",
      icon: ClipboardList,
      match: (p) => p.includes("/decisions"),
      defaultExpanded: true,
      children: DECISION_TABS.map((t) => ({
        href: openRoundId
          ? `${decisionBase}?tab=${t.key}`
          : `/decisions?tab=${t.key}`,
        label: t.label,
        icon: t.icon,
        match: (p: string, search: string) => {
          if (!p.includes("/decisions")) return false;
          const tab = new URLSearchParams(search).get("tab");
          if (t.key === "recruitment") {
            return !tab || tab === "recruitment";
          }
          return tab === t.key;
        },
      })),
    },
    {
      href: reviewHref,
      label: "Review & Submit",
      icon: FileCheck2,
      match: (p: string) => p.includes("/review"),
    },
    {
      href: "/reports",
      label: "Reports & HR Analytics",
      icon: BarChart3,
      match: (p) =>
        p.startsWith("/reports") ||
        p.startsWith("/history") ||
        p.includes("/results"),
      children: [
        {
          href: "/reports/workforce-brief",
          label: "The Workforce Brief",
          icon: FileText,
          match: (p) =>
            p.startsWith("/reports/workforce-brief") ||
            p.includes("/results") ||
            p === "/reports",
        },
        {
          href: "/reports/balance-sheet",
          label: "Balance Sheet",
          icon: Landmark,
          match: (p) => p.startsWith("/reports/balance-sheet"),
        },
        {
          href: "/reports/profit-loss",
          label: "Profit & Loss Statement",
          icon: LineChart,
          match: (p) => p.startsWith("/reports/profit-loss"),
        },
        {
          href: "/reports/cash-flow",
          label: "Cash Flow Statement",
          icon: Wallet,
          match: (p) => p.startsWith("/reports/cash-flow"),
        },
        {
          href: "/reports/financial-ratios",
          label: "Financial Ratios",
          icon: BarChart3,
          match: (p) => p.startsWith("/reports/financial-ratios"),
        },
        {
          href: "/leaderboard",
          label: "Leaderboard",
          icon: Trophy,
          match: (p) => p.startsWith("/leaderboard"),
        },
      ],
    },
    {
      href: "/team",
      label: "Team & Company",
      icon: Building2,
      match: (p) => p.startsWith("/team"),
      children: [
        {
          href: "/team",
          label: "Company Profile",
          icon: Building2,
          match: (p) => p === "/team" || p === "/team/company",
        },
        {
          href: "/team/members",
          label: "My Team",
          icon: Users,
          match: (p) => p.startsWith("/team/members"),
        },
        {
          href: "/team/industry-strategy",
          label: "Industry & Strategy Brief",
          icon: Briefcase,
          match: (p) => p.startsWith("/team/industry-strategy"),
        },
        {
          href: "/team/instructor",
          label: "Instructor Information",
          icon: GraduationCap,
          match: (p) => p.startsWith("/team/instructor"),
        },
      ],
    },
    {
      href: "/resources",
      label: "Resources",
      icon: Library,
      match: (p) => p.startsWith("/resources"),
      defaultExpanded: true,
      children: [
        {
          href: "/resources",
          label: "Overview",
          icon: LayoutDashboard,
          match: (p) => p === "/resources",
        },
        {
          href: "/resources/learning-guides",
          label: "HR Decision Learning Guides",
          icon: GraduationCap,
          match: (p) => p.startsWith("/resources/learning-guides"),
        },
        {
          href: "/resources/reference",
          label: "Simulation Reference Center",
          icon: BookOpen,
          match: (p) => p.startsWith("/resources/reference"),
        },
        {
          href: "/resources/metrics",
          label: "HR Metrics Reference",
          icon: BarChart3,
          match: (p) => p.startsWith("/resources/metrics"),
        },
        {
          href: "/resources/downloads",
          label: "Downloads & Course Resources",
          icon: Download,
          match: (p) => p.startsWith("/resources/downloads"),
        },
      ],
    },
    {
      href: "/help",
      label: "Help Center",
      icon: CircleHelp,
      match: (p) => p.startsWith("/help"),
    },
  ];
}

export const STUDENT_QUICK_LINKS: PortalNavItem[] = [
  {
    href: "/team",
    label: "Company Profile",
    icon: IdCard,
    match: () => false,
  },
  {
    href: "/team/members",
    label: "My Team",
    icon: Users,
    match: () => false,
  },
  {
    href: "/team/instructor",
    label: "Instructor Info",
    icon: GraduationCap,
    match: () => false,
  },
  {
    href: "/help#messages",
    label: "Messages",
    icon: Mail,
    match: () => false,
  },
];

export function professorNavItems(opts: {
  sessionId: string | null;
}): PortalNavItem[] {
  const { sessionId } = opts;
  const ops = sessionId ? `/sessions/${sessionId}` : "/sessions/manage";

  return [
    {
      href: "/sessions",
      label: "Dashboard",
      icon: Home,
      match: (p) => p === "/sessions",
    },
    {
      href: "/sessions/manage",
      label: "Course Management",
      icon: BookOpen,
      defaultExpanded: true,
      match: (p) =>
        p.startsWith("/sessions/manage") ||
        p === "/sessions/new" ||
        (!!sessionId &&
          (p === ops ||
            p.startsWith(`${ops}/course`) ||
            p.startsWith(`${ops}/teams`) ||
            p.startsWith(`${ops}/announcements`) ||
            p.startsWith(`${ops}/rounds`))),
      children: [
        {
          href: sessionId ? `${ops}/course` : "/sessions/manage",
          label: "Course Overview",
          icon: LayoutDashboard,
          match: (p) =>
            p === "/sessions/manage" ||
            p.endsWith("/course") ||
            (!!sessionId && p === ops),
        },
        {
          href: sessionId ? `${ops}/teams` : "/sessions/manage",
          label: "Teams & Enrollment",
          icon: Users,
          match: (p) => p.includes("/teams"),
        },
        {
          href: sessionId ? `${ops}/announcements` : "/sessions/manage",
          label: "Announcements",
          icon: Megaphone,
          match: (p) => p.includes("/announcements"),
        },
        {
          href: sessionId ? `${ops}/rounds` : "/sessions/manage",
          label: "Round Management",
          icon: CalendarDays,
          match: (p) => p.includes("/rounds"),
        },
      ],
    },
    {
      href: sessionId ? `${ops}/reports` : "/sessions",
      label: "Class Performance",
      icon: LineChart,
      match: (p) =>
        p.includes("/reports") ||
        p.includes("/leaderboard") ||
        p.startsWith("/sessions/class-performance"),
      children: [
        {
          href: sessionId ? `${ops}/reports` : "/sessions",
          label: "Industry Results",
          icon: LineChart,
          match: (p) => p.includes("/reports"),
        },
        {
          href: "/sessions/class-performance/team-comparison",
          label: "Team Comparison",
          icon: Users,
          match: (p) => p.includes("team-comparison"),
        },
        {
          href: "/sessions/class-performance/decision-analysis",
          label: "Decision Analysis",
          icon: ClipboardList,
          match: (p) => p.includes("decision-analysis"),
        },
        {
          href: sessionId ? `${ops}/leaderboard` : "/sessions",
          label: "Industry Scoring",
          icon: Trophy,
          match: (p) => p.includes("/leaderboard"),
        },
        {
          href: "/sessions/class-performance/analytics",
          label: "Reports & Analytics",
          icon: BarChart3,
          match: (p) => p.includes("/class-performance/analytics"),
        },
      ],
    },
    {
      href: "/sessions/teaching",
      label: "Teaching & Debrief",
      icon: Presentation,
      match: (p) => p.startsWith("/sessions/teaching"),
      children: [
        {
          href: "/sessions/teaching/round-insights",
          label: "Round Insights",
          icon: Lightbulb,
          match: (p) => p.includes("round-insights"),
        },
        {
          href: "/sessions/teaching/team-insights",
          label: "Team Insights",
          icon: Users,
          match: (p) => p.includes("team-insights"),
        },
        {
          href: "/sessions/teaching/debrief",
          label: "Discussion & Debrief",
          icon: MessageSquare,
          match: (p) => p.includes("/debrief"),
        },
        {
          href: "/sessions/teaching/learning-analytics",
          label: "Learning Analytics",
          icon: BarChart3,
          match: (p) => p.includes("learning-analytics"),
        },
      ],
    },
    {
      href: "/sessions/professor-resources",
      label: "Resources",
      icon: FolderOpen,
      match: (p) => p.startsWith("/sessions/professor-resources"),
      children: [
        {
          href: "/sessions/professor-resources/guide",
          label: "Professor Guide",
          icon: BookOpen,
          match: (p) => p.includes("/guide"),
        },
        {
          href: "/sessions/professor-resources/teaching",
          label: "Teaching Resources",
          icon: GraduationCap,
          match: (p) => p.includes("/teaching"),
        },
        {
          href: "/sessions/professor-resources/reference",
          label: "Simulation Reference",
          icon: Library,
          match: (p) => p.includes("/reference"),
        },
        {
          href: "/sessions/professor-resources/downloads",
          label: "Downloads",
          icon: Download,
          match: (p) => p.includes("/downloads"),
        },
      ],
    },
    {
      href: "/sessions/config",
      label: "Simulation Lab",
      icon: FlaskConical,
      defaultExpanded: true,
      match: (p) =>
        p.startsWith("/sessions/config") ||
        p.startsWith("/sessions/testing") ||
        p.includes("/inspect"),
      children: [
        {
          href: sessionId ? `${ops}/inspect` : "/sessions/config",
          label: "Formula Inspect",
          icon: Search,
          match: (p) => p.includes("/inspect"),
        },
        {
          href: "/sessions/config",
          label: "Configuration",
          icon: Settings,
          match: (p) => p.startsWith("/sessions/config"),
        },
        {
          href: "/sessions/testing",
          label: "Testing Center",
          icon: FlaskConical,
          match: (p) => p.startsWith("/sessions/testing"),
        },
      ],
    },
    {
      href: "/sessions/help",
      label: "Help Center",
      icon: CircleHelp,
      match: (p) => p.startsWith("/sessions/help"),
    },
  ];
}

export function adminNavItems(): PortalNavItem[] {
  return [
    {
      href: "/admin",
      label: "Dashboard",
      icon: Shield,
      match: (p) => p === "/admin",
    },
    {
      href: "/admin/users",
      label: "User Management",
      icon: Users,
      match: (p) => p.startsWith("/admin/users"),
    },
    {
      href: "/admin/formulas",
      label: "Formula Repository",
      icon: FunctionSquare,
      match: (p) => p.startsWith("/admin/formulas"),
    },
    {
      href: "/admin/versions",
      label: "Version Management",
      icon: History,
      match: (p) => p.startsWith("/admin/versions"),
    },
    {
      href: "/admin/audit",
      label: "Audit Log",
      icon: ScrollText,
      match: (p) => p.startsWith("/admin/audit"),
    },
    {
      href: "/admin/system",
      label: "System",
      icon: Server,
      match: (p) => p.startsWith("/admin/system"),
    },
    {
      href: "/sessions/config",
      label: "Configuration",
      icon: Settings,
      match: (p) => p.startsWith("/sessions/config"),
    },
    {
      href: "/sessions/testing",
      label: "Testing Center",
      icon: FlaskConical,
      match: (p) => p.startsWith("/sessions/testing"),
    },
  ];
}
