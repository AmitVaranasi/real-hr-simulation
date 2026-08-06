"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; match?: (path: string) => boolean };

function linkClass(active: boolean) {
  return active
    ? "border-b-2 border-[var(--portal-primary)] pb-0.5 font-medium text-[var(--portal-primary)]"
    : "text-[var(--portal-muted)] hover:text-[var(--portal-title)]";
}

export function StudentRoleNav({
  openRoundId,
}: {
  openRoundId: string | null;
}) {
  const pathname = usePathname();
  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    ...(openRoundId
      ? [
          {
            href: `/round/${openRoundId}/decisions`,
            label: "Decisions",
            match: (p: string) => p.includes("/decisions"),
          },
          {
            href: `/round/${openRoundId}/review`,
            label: "Review & Submit",
            match: (p: string) => p.includes("/review"),
          },
        ]
      : []),
    { href: "/history", label: "Reports" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {items.map((item) => {
        const active = item.match
          ? item.match(pathname)
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={linkClass(active)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ProfessorRoleNav({
  sessionId,
}: {
  sessionId?: string | null;
}) {
  const pathname = usePathname();
  const items: NavItem[] = [
    { href: "/sessions", label: "Dashboard", match: (p) => p === "/sessions" },
    ...(sessionId
      ? [
          {
            href: `/sessions/${sessionId}`,
            label: "Course",
            match: (p: string) =>
              p === `/sessions/${sessionId}` ||
              (p.startsWith(`/sessions/${sessionId}/`) &&
                !p.includes("/reports") &&
                !p.includes("/inspect") &&
                !p.includes("/leaderboard")),
          },
          {
            href: `/sessions/${sessionId}/reports`,
            label: "Reports",
            match: (p: string) => p.includes("/reports"),
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

  return (
    <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {items.map((item) => {
        const active = item.match
          ? item.match(pathname)
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={linkClass(active)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
