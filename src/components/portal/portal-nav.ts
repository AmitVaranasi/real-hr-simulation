export type PortalNavItem = {
  href: string;
  label: string;
  match?: (pathname: string, search: string) => boolean;
  children?: PortalNavItem[];
};

export const DECISION_TABS = [
  { key: "recruitment", label: "Recruitment", index: 0 },
  { key: "performance", label: "Performance", index: 1 },
  { key: "training", label: "Training", index: 2 },
  { key: "relations", label: "Employee Relations", index: 3 },
  { key: "compensation", label: "Compensation", index: 4 },
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
      match: (p) => p.startsWith("/dashboard/getting-started"),
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      match: (p) => p === "/dashboard",
    },
    {
      href: decisionBase,
      label: "Decisions",
      match: (p) => p.includes("/decisions"),
      children: openRoundId
        ? DECISION_TABS.map((t) => ({
            href: `${decisionBase}?tab=${t.key}`,
            label: t.label,
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
            match: (p: string) => p.includes("/review"),
          },
        ]
      : []),
    {
      href: "/history",
      label: "Reports",
      match: (p) => p.startsWith("/history") || p.includes("/results"),
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
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
      match: (p) => p === "/sessions",
    },
    {
      href: "/sessions/manage",
      label: "Manage Course",
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
            match: (p: string) => p.includes("/reports"),
          },
          {
            href: `/sessions/${sessionId}/leaderboard`,
            label: "Industry Scoring",
            match: (p: string) => p.includes("/leaderboard"),
          },
          {
            href: `/sessions/${sessionId}/inspect`,
            label: "Formula Inspect",
            match: (p: string) => p.includes("/inspect"),
          },
        ]
      : []),
    {
      href: "/sessions/config",
      label: "Configuration",
      match: (p) => p.startsWith("/sessions/config"),
    },
    {
      href: "/sessions/testing",
      label: "Testing Center",
      match: (p) => p.startsWith("/sessions/testing"),
    },
  ];
}
