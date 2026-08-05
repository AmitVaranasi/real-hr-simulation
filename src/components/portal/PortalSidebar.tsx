"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  STUDENT_QUICK_LINKS,
  type PortalNavItem,
} from "./portal-nav";

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
}: {
  item: PortalNavItem;
  search: string;
  pathname: string;
  onNavigate?: () => void;
  forceExpanded?: boolean;
}) {
  const hasChildren = Boolean(item.children?.length);
  const selfActive = item.match
    ? item.match(pathname, search)
    : pathname === item.href;
  const childActive = item.children?.some((c) =>
    c.match ? c.match(pathname, search) : pathname === c.href
  );
  const [open, setOpen] = useState(
    Boolean(forceExpanded || item.defaultExpanded || selfActive || childActive)
  );

  useEffect(() => {
    if (selfActive || childActive || forceExpanded) setOpen(true);
  }, [selfActive, childActive, forceExpanded]);

  const Icon = item.icon;
  const active = selfActive || childActive;

  return (
    <li>
      <div className="flex items-stretch gap-0.5">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-md border-l-[3px] px-3 py-2 text-sm transition-colors ${
            active
              ? "border-[#e67e22] bg-[#fff4e8] font-semibold text-[#c45f12]"
              : "border-transparent text-[#1f2937] hover:bg-white hover:text-[#e67e22]"
          }`}
        >
          {Icon && (
            <Icon className="h-4 w-4 shrink-0 text-[#e67e22]" strokeWidth={2} />
          )}
          <span className="truncate">{item.label}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
            onClick={() => setOpen((v) => !v)}
            className="rounded-md px-1.5 text-[#6b7280] hover:bg-white hover:text-[#1f2937]"
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-[#dde1e6] pl-2">
          {item.children!.map((child) => {
            const childIsActive = child.match
              ? child.match(pathname, search)
              : pathname === child.href;
            const ChildIcon = child.icon;
            return (
              <li key={`${child.href}-${child.label}`}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                    childIsActive
                      ? "bg-[#fff4e8] font-semibold text-[#c45f12]"
                      : "text-[#6b7280] hover:bg-white hover:text-[#1f2937]"
                  }`}
                >
                  {ChildIcon && (
                    <ChildIcon
                      className="h-3.5 w-3.5 shrink-0 text-[#e67e22]"
                      strokeWidth={2}
                    />
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
  economy?: string | null;
};

export function PortalSidebar({
  items,
  brandSubtitle,
  displayName,
  roleLabel,
  homeHref = "/dashboard",
  showStudentChrome = false,
  simulation,
  collapsed = false,
  onNavigate,
}: {
  items: PortalNavItem[];
  brandSubtitle: string;
  displayName?: string;
  roleLabel?: string;
  homeHref?: string;
  showStudentChrome?: boolean;
  simulation?: StudentSimulationSummary | null;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";

  const decisionsExpanded = useMemo(
    () => pathname.includes("/decisions") || pathname.includes("/review"),
    [pathname]
  );

  if (collapsed) {
    return (
      <aside className="flex h-svh max-h-svh min-h-0 w-full flex-col border-r border-[#dde1e6] bg-[#f4f5f7]" />
    );
  }

  return (
    <aside className="flex h-svh max-h-svh min-h-0 w-full flex-col border-r border-[#dde1e6] bg-[#f4f5f7] text-[#1f2937]">
      <div className="shrink-0 border-b border-[#dde1e6] px-4 py-4">
        <Link
          href={homeHref}
          className="block text-base font-bold tracking-tight text-[#e67e22]"
          onClick={onNavigate}
        >
          Real HR Simulation
        </Link>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
          {brandSubtitle}
        </p>
      </div>

      {showStudentChrome && displayName && (
        <div className="shrink-0 border-b border-[#dde1e6] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e67e22] text-sm font-bold text-white">
              {initialsFromName(displayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1f2937]">
                {displayName}
              </p>
              <p className="text-xs text-[#6b7280]">{roleLabel ?? "Student"}</p>
            </div>
          </div>
        </div>
      )}

      {showStudentChrome && simulation && (
        <div className="shrink-0 border-b border-[#dde1e6] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#e67e22]">
            Your Simulation
          </p>
          <dl className="mt-2 space-y-1.5 text-xs">
            <div>
              <dt className="text-[#6b7280]">Company</dt>
              <dd className="truncate font-semibold text-[#1f2937]">
                {simulation.company}
              </dd>
            </div>
            <div>
              <dt className="text-[#6b7280]">Course</dt>
              <dd className="truncate text-[#1f2937]">{simulation.course}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-[#6b7280]">Industry</dt>
                <dd className="truncate text-[#1f2937]">{simulation.industry}</dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Strategy</dt>
                <dd className="truncate text-[#1f2937]">{simulation.strategy}</dd>
              </div>
            </div>
            <div>
              <dt className="text-[#6b7280]">Round</dt>
              <dd className="font-medium text-[#1f2937]">{simulation.roundLabel}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="shrink-0 px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wide text-[#6b7280]">
        Menu
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <NavBranch
              key={item.href + item.label}
              item={item}
              search={search}
              pathname={pathname}
              onNavigate={onNavigate}
              forceExpanded={
                item.label === "HR Decisions" ? decisionsExpanded : undefined
              }
            />
          ))}
        </ul>

        {showStudentChrome && (
          <>
            <div className="mt-5 px-2 text-[10px] font-bold uppercase tracking-wide text-[#6b7280]">
              Quick Links
            </div>
            <ul className="mt-1 space-y-0.5 px-0">
              {STUDENT_QUICK_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-[#6b7280] hover:bg-white hover:text-[#1f2937]"
                    >
                      {Icon && (
                        <Icon className="h-3.5 w-3.5 text-[#e67e22]" strokeWidth={2} />
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

      <div className="shrink-0 border-t border-[#dde1e6] px-4 py-3 text-[11px] text-[#6b7280]">
        Real HR Simulation
      </div>
    </aside>
  );
}
