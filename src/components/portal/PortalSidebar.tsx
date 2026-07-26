"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PortalNavItem } from "./portal-nav";

export function PortalSidebar({
  items,
  brandSubtitle,
  onNavigate,
}: {
  items: PortalNavItem[];
  brandSubtitle: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-slate-200 bg-[#1e293b] text-slate-100">
      <div className="border-b border-slate-700 px-4 py-4">
        <Link
          href="/"
          className="block text-sm font-semibold tracking-wide text-white"
          onClick={onNavigate}
        >
          Real HR Simulation
        </Link>
        <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
          {brandSubtitle}
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = item.match
              ? item.match(pathname, search)
              : pathname === item.href;
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-indigo-600 font-medium text-white"
                      : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && item.children.length > 0 && (
                  <ul className="mt-0.5 space-y-0.5 border-l border-slate-600 ml-3 pl-2">
                    {item.children.map((child) => {
                      const childActive = child.match
                        ? child.match(pathname, search)
                        : false;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onNavigate}
                            className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                              childActive
                                ? "bg-slate-700 font-medium text-white"
                                : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-100"
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-slate-700 px-4 py-3 text-[11px] text-slate-500">
        Real HR · Class portal
      </div>
    </aside>
  );
}
