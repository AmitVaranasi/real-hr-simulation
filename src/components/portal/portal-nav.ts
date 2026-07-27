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
} from "lucide-react";

export type PortalNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  match?: (pathname: string, search: string) => boolean;
  children?: PortalNavItem[];
};

export const DECISION_TABS = [
  { key: "recruitment", label: "Recruitment", index: 0, icon: UserPlus },
  { key: "performance", label: "Performance", index: 1, icon: Briefcase },
  { key: "training", label: "Training", index: 2, icon: GraduationCap },
  { key: "relations", label: "Employee Relations", index: 3, icon: HeartHandshake },
  { key: "compensation", label: "Compensation", index: 4, icon: Wallet },
] as const;

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
      href: "/join",
      label: "Join Session",
      icon: UserPlus,
      match: (p) => p === "/join" || p.startsWith("/join/"),
    },
    {
      href: decisionBase,
      label: "Decisions",
      icon: ClipboardList,
      match: (p) => p.includes("/decisions"),
      children: openRoundId
        ? DECISION_TABS.map((t) => ({
            href: `${decisionBase}?tab=${t.key}`,
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
          }))
        : [],
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
      : []),
    {
      href: "/history",
      label: "Reports",
      icon: BarChart3,
      match: (p) => p.startsWith("/history") || p.includes("/results"),
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      match: (p) => p.startsWith("/leaderboard"),
    },
  ];
}

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
