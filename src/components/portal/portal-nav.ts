import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Rocket,
  ClipboardList,
  FileCheck2,
  BarChart3,
  Trophy,
  BookOpen,
  Wrench,
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
  FileText,
  Landmark,
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
  const decisionBase = openRoundId
    ? `/round/${openRoundId}/decisions`
    : "/dashboard";

  return [
    {
      href: "/dashboard/getting-started",
      label: "Getting Started",
      icon: Rocket,
      match: (p) => p.startsWith("/dashboard/getting-started"),
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
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
          : "/dashboard/getting-started",
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
    ...(openRoundId
      ? [
          {
            href: `/round/${openRoundId}/review`,
            label: "Review & Submit",
            icon: FileCheck2,
            match: (p: string) => p.includes("/review"),
          },
        ]
      : [
          {
            href: "/dashboard",
            label: "Review & Submit",
            icon: FileCheck2,
            match: () => false,
          },
        ]),
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
      children: [
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
      ],
    },
    {
      href: "/help",
      label: "Help Center",
      icon: CircleHelp,
      match: (p) => p.startsWith("/help"),
    },
    {
      href: "/join",
      label: "Join Session",
      icon: UserPlus,
      match: (p) => p === "/join" || p.startsWith("/join/"),
    },
  ];
}

export const STUDENT_QUICK_LINKS: PortalNavItem[] = [
  {
    href: "/help#messages",
    label: "Messages",
    icon: MessageSquare,
    match: () => false,
  },
];

export function professorNavItems(opts: {
  sessionId: string | null;
}): PortalNavItem[] {
  const { sessionId } = opts;
  return [
    {
      href: "/sessions",
      label: "Dashboard",
      icon: LayoutDashboard,
      match: (p) => p === "/sessions",
    },
    {
      href: "/sessions/manage",
      label: "Manage Course",
      icon: BookOpen,
      match: (p) =>
        p === "/sessions/manage" ||
        p === "/sessions/new" ||
        p.startsWith("/sessions/manage"),
    },
    ...(sessionId
      ? [
          {
            href: `/sessions/${sessionId}`,
            label: "Course Ops",
            icon: Wrench,
            match: (p: string) =>
              p === `/sessions/${sessionId}` ||
              (p.startsWith(`/sessions/${sessionId}/`) &&
                !p.includes("/reports") &&
                !p.includes("/inspect") &&
                !p.includes("/leaderboard")),
          },
          {
            href: `/sessions/${sessionId}/reports`,
            label: "Industry Results",
            icon: LineChart,
            match: (p: string) => p.includes("/reports"),
          },
          {
            href: `/sessions/${sessionId}/leaderboard`,
            label: "Industry Scoring",
            icon: Trophy,
            match: (p: string) => p.includes("/leaderboard"),
          },
          {
            href: `/sessions/${sessionId}/inspect`,
            label: "Formula Inspect",
            icon: Search,
            match: (p: string) => p.includes("/inspect"),
          },
        ]
      : []),
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
