"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import {
  STUDENT_QUICK_LINKS,
  type PortalNavItem,
} from "./portal-nav";
import {
  getVisitedModules,
  subscribeModuleVisited,
} from "@/lib/student/module-progress";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function NavBranch({
  item,
  search,
  pathname,
  onNavigate,
  forceExpanded,
  dark,
  /** Student PNG: orange active; professor: blue */
  accent = "blue",
  completedTabKeys = [],
}: {
  item: PortalNavItem;
  search: string;
  pathname: string;
  onNavigate?: () => void;
  forceExpanded?: boolean;
  dark?: boolean;
  accent?: "orange" | "blue";
  /** Tab keys with green checks under HR Decisions (PNG) */
  completedTabKeys?: string[];
}) {
  const hasChildren = Boolean(item.children?.length);
  const selfActive = item.match
    ? item.match(pathname, search)
    : pathname === item.href;
  const childActive = item.children?.some((c) =>
    c.match ? c.match(pathname, search) : pathname === c.href
  );
  const shouldExpand = Boolean(
    forceExpanded || item.defaultExpanded || selfActive || childActive
  );
  const [open, setOpen] = useState(shouldExpand);

  // Expand only when the current route requires it; collapse otherwise (PNG).
  useEffect(() => {
    setOpen(shouldExpand);
  }, [shouldExpand]);

  const Icon = item.icon;
  const parentActive = selfActive || Boolean(childActive);
  const activeColor =
    accent === "orange" ? "text-[var(--portal-brand)]" : "text-[var(--portal-primary)]";
  const activeSoft =
    accent === "orange"
      ? "bg-[var(--portal-brand-soft)]"
      : "bg-[var(--portal-primary-soft)]";
  const activeDot =
    accent === "orange" ? "bg-[var(--portal-brand)]" : "bg-[var(--portal-primary)]";
  const activeBar =
    accent === "orange"
      ? "border-l-[3px] border-[var(--portal-brand)]"
      : "border-l-[3px] border-[var(--portal-primary)]";

  return (
    <li>
      <div className="flex items-stretch gap-0.5">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors ${
            parentActive
              ? dark
                ? `bg-white/10 font-semibold ${activeColor}`
                : accent === "orange"
                  ? `${activeBar} font-semibold ${activeColor}`
                  : `${activeSoft} ${activeBar} font-semibold ${activeColor}`
              : dark
                ? "text-slate-200 hover:bg-white/5 hover:text-white"
                : "text-[var(--portal-ink)] hover:bg-[#f4f5f7] hover:text-[var(--portal-brand)]"
          }`}
        >
          {Icon && (
            <Icon
              className={`h-[18px] w-[18px] shrink-0 ${
                parentActive
                  ? activeColor
                  : dark
                    ? "text-slate-400"
                    : "text-[var(--portal-muted)]"
              }`}
              strokeWidth={1.75}
            />
          )}
          <span className="truncate">{item.label}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
            onClick={() => setOpen((v) => !v)}
            className={`rounded-md px-1.5 ${
              dark
                ? "text-slate-400 hover:bg-white/5 hover:text-white"
                : "text-[var(--portal-muted)] hover:bg-[#f4f5f7] hover:text-[var(--portal-ink)]"
            }`}
          >
            {open ? (
              <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul
          className={`mt-0.5 ml-3 space-y-0.5 border-l pl-2 ${
            dark ? "border-white/10" : "border-[var(--portal-sidebar-border)]"
          }`}
        >
          {item.children!.map((child) => {
            const childIsActive = child.match
              ? child.match(pathname, search)
              : pathname === child.href;
            const tabKey = child.href.includes("tab=")
              ? new URLSearchParams(child.href.split("?")[1] ?? "").get("tab")
              : null;
            const completed =
              Boolean(tabKey) && completedTabKeys.includes(tabKey!);
            return (
              <li key={`${child.href}-${child.label}`}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors ${
                    childIsActive
                      ? dark
                        ? `bg-white/10 font-semibold ${activeColor}`
                        : `font-semibold ${activeColor}`
                      : dark
                        ? "text-slate-300 hover:bg-white/5 hover:text-white"
                        : "text-[var(--portal-muted)] hover:bg-[#f4f5f7] hover:text-[var(--portal-ink)]"
                  }`}
                >
                  {completed ? (
                    <Check
                      className="h-3.5 w-3.5 shrink-0 text-[var(--portal-success)]"
                      strokeWidth={2.5}
                    />
                  ) : childIsActive ? (
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${activeDot}`} />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--portal-sidebar-border)]" />
                  )}
                  <span>{child.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export type StudentSimulationSummary = {
  company: string;
  course: string;
  industry: string;
  strategy: string;
  roundLabel: string;
  roundNumber?: number | null;
  roundStatus?: string | null;
  economy?: string | null;
};

export function PortalSidebar({
  items,
  brandSubtitle,
  displayName,
  roleLabel,
  homeHref = "/dashboard",
  showStudentChrome = false,
  darkNav = false,
  simulation,
  courseSummary,
  collapsed = false,
  onNavigate,
}: {
  items: PortalNavItem[];
  brandSubtitle: string;
  displayName?: string;
  roleLabel?: string;
  homeHref?: string;
  showStudentChrome?: boolean;
  /** Full navy sidebar (professor PNG) */
  darkNav?: boolean;
  simulation?: StudentSimulationSummary | null;
  courseSummary?: {
    courseName: string;
    term: string;
    roundsSummary: string;
  } | null;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const [completedTabKeys, setCompletedTabKeys] = useState<string[]>([]);

  // Keep HR Decisions open on Review so module checkmarks stay visible (PNG 018).
  const decisionsExpanded = useMemo(
    () => pathname.includes("/review"),
    [pathname]
  );

  // Resolve open-round id from decision/review URLs for visit tracking.
  const openRoundIdFromPath = useMemo(() => {
    const m = pathname.match(/^\/round\/([0-9a-f-]{36})/i);
    return m?.[1] ?? null;
  }, [pathname]);

  useEffect(() => {
    if (!openRoundIdFromPath) {
      setCompletedTabKeys([]);
      return;
    }
    setCompletedTabKeys(getVisitedModules(openRoundIdFromPath));
    return subscribeModuleVisited((detail) => {
      if (detail.roundId === openRoundIdFromPath) {
        setCompletedTabKeys(getVisitedModules(openRoundIdFromPath));
      }
    });
  }, [openRoundIdFromPath]);

  if (collapsed) {
    return (
      <aside
        className={`flex h-svh max-h-svh min-h-0 w-full flex-col border-r ${
          darkNav
            ? "border-transparent bg-[var(--portal-navy)]"
            : "border-[var(--portal-sidebar-border)] bg-white"
        }`}
      />
    );
  }

  const roundDisplay =
    simulation?.roundNumber != null
      ? `Round ${simulation.roundNumber}`
      : simulation?.roundLabel?.split("—")[0]?.trim() || "—";
  const statusDisplay =
    simulation?.roundStatus ||
    (simulation?.roundLabel?.includes("OPEN")
      ? "Open"
      : simulation
        ? "Waiting"
        : "—");

  const asideClass = darkNav
    ? "flex h-svh max-h-svh min-h-0 w-full flex-col bg-[var(--portal-navy)] text-white"
    : "flex h-svh max-h-svh min-h-0 w-full flex-col border-r border-[var(--portal-sidebar-border)] bg-white text-[var(--portal-ink)]";

  return (
    <aside className={asideClass}>
      {/* Profile block */}
      {displayName ? (
        <div
          className={`shrink-0 px-4 py-4 ${
            darkNav || showStudentChrome
              ? "bg-[var(--portal-navy)]"
              : "border-b border-[var(--portal-sidebar-border)]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2f6fed] text-sm font-bold text-white ring-2 ring-white/20">
              {initialsFromName(displayName)}
            </div>
            <div className="min-w-0">
              <p
                className={`truncate text-sm font-semibold ${
                  darkNav || showStudentChrome
                    ? "text-white"
                    : "text-[var(--portal-ink)]"
                }`}
              >
                {displayName}
              </p>
              <p
                className={`text-xs ${
                  darkNav || showStudentChrome
                    ? "text-sky-200/80"
                    : "text-[var(--portal-muted)]"
                }`}
              >
                {roleLabel ?? brandSubtitle}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-b border-[var(--portal-sidebar-border)] px-4 py-4">
          <Link
            href={homeHref}
            className="block text-base font-bold tracking-tight text-[var(--portal-primary)]"
            onClick={onNavigate}
          >
            Real HR Simulation
          </Link>
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <NavBranch
              key={item.href + item.label}
              item={item}
              search={search}
              pathname={pathname}
              onNavigate={onNavigate}
              dark={darkNav}
              accent={showStudentChrome ? "orange" : "blue"}
              completedTabKeys={
                item.label === "HR Decisions" ? completedTabKeys : undefined
              }
              forceExpanded={
                item.label === "HR Decisions"
                  ? decisionsExpanded
                  : item.label === "Simulation Lab" ||
                      item.label === "Course Management"
                    ? true
                    : undefined
              }
            />
          ))}
        </ul>

        {showStudentChrome && (
          <>
            <div
              className={`mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.08em] ${
                darkNav ? "text-slate-400" : "text-[var(--portal-muted)]"
              }`}
            >
              Quick Links
            </div>
            <ul className="mt-1 space-y-0.5">
              {STUDENT_QUICK_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[12px] ${
                        darkNav
                          ? "text-slate-300 hover:bg-white/5 hover:text-white"
                          : "text-[var(--portal-muted)] hover:bg-[#f4f5f7] hover:text-[var(--portal-ink)]"
                      }`}
                    >
                      {Icon && (
                        <Icon
                          className="h-3.5 w-3.5 text-[var(--portal-accent-blue)]"
                          strokeWidth={1.75}
                        />
                      )}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>

      {showStudentChrome && simulation ? (
        <div className="shrink-0 p-3">
          <div
            className={`rounded-xl border px-3.5 py-3 ${
              darkNav
                ? "border-white/10 bg-[#102a4d]"
                : "border-[var(--portal-sidebar-border)] bg-[#f3f5f8]"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.08em] ${
                darkNav ? "text-slate-400" : "text-[var(--portal-muted)]"
              }`}
            >
              Your Simulation
            </p>
            <dl className="mt-2 space-y-1.5 text-[12px]">
              {[
                ["Company", simulation.company],
                ["Industry", simulation.industry],
                ["Strategy", simulation.strategy],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className={darkNav ? "text-slate-400" : "text-[var(--portal-muted)]"}>
                    {label}
                  </dt>
                  <dd
                    className={`truncate font-semibold ${
                      darkNav ? "text-white" : "text-[var(--portal-ink)]"
                    }`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-2">
                <dt className={darkNav ? "text-slate-400" : "text-[var(--portal-muted)]"}>
                  Current Round
                </dt>
                <dd className="text-right">
                  <p
                    className={`font-semibold ${
                      darkNav ? "text-white" : "text-[var(--portal-ink)]"
                    }`}
                  >
                    {roundDisplay}
                  </p>
                  <p
                    className={`text-[11px] ${
                      statusDisplay.toLowerCase() === "open"
                        ? "font-semibold text-[var(--portal-success)]"
                        : darkNav
                          ? "text-slate-300"
                          : "text-[var(--portal-muted)]"
                    }`}
                  >
                    {statusDisplay.toLowerCase() === "open"
                      ? "Open"
                      : statusDisplay === "Waiting"
                        ? "Waiting for Instructor"
                        : statusDisplay}
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : courseSummary ? (
        <div
          className={`shrink-0 px-4 py-3 ${
            darkNav
              ? "m-3 rounded-lg border border-white/10 bg-[#102a4d]"
              : "border-t border-[var(--portal-sidebar-border)] bg-[#f3f5f8]"
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.08em] ${
              darkNav ? "text-slate-400" : "text-[var(--portal-muted)]"
            }`}
          >
            Your Course
          </p>
          <p
            className={`mt-2 text-sm font-semibold ${
              darkNav ? "text-white" : "text-[var(--portal-ink)]"
            }`}
          >
            {courseSummary.courseName}
          </p>
          <p className={`text-xs ${darkNav ? "text-slate-300" : "text-[var(--portal-muted)]"}`}>
            {courseSummary.term}
          </p>
          <p
            className={`mt-1 text-xs ${
              darkNav ? "text-slate-200" : "text-[var(--portal-ink)]"
            }`}
          >
            {courseSummary.roundsSummary}
          </p>
          <Link
            href="/sessions/manage"
            onClick={onNavigate}
            className="mt-3 inline-block text-[12px] font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View Course Settings →
          </Link>
        </div>
      ) : (
        <div
          className={`shrink-0 px-4 py-3 text-[11px] ${
            darkNav
              ? "border-t border-white/10 text-slate-500"
              : "border-t border-[var(--portal-sidebar-border)] text-[var(--portal-muted)]"
          }`}
        >
          Real HR Simulation
        </div>
      )}
    </aside>
  );
}
