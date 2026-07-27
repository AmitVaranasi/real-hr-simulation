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
    <aside className="flex h-svh max-h-svh min-h-0 w-full flex-col border-r border-[#dde1e6] bg-[#f4f5f7] text-[#1f2937]">
      <div className="shrink-0 border-b border-[#dde1e6] px-4 py-4">
        <Link
          href="/"
          className="block text-base font-bold tracking-tight text-[#e67e22]"
          onClick={onNavigate}
        >
          Real HR
        </Link>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
          {brandSubtitle}
        </p>
      </div>

      <div className="shrink-0 px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wide text-[#6b7280]">
        Menu
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = item.match
              ? item.match(pathname, search)
              : pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-md border-l-[3px] px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-[#e67e22] bg-[#fff4e8] font-semibold text-[#c45f12]"
                      : "border-transparent text-[#1f2937] hover:bg-white hover:text-[#e67e22]"
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-[#e67e22]" : "text-[#e67e22]"
                      }`}
                      strokeWidth={2}
                    />
                  )}
                  <span className={active ? "text-[#c45f12]" : "text-[#1f2937]"}>
                    {item.label}
                  </span>
                </Link>
                {item.children && item.children.length > 0 && (
                  <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-[#dde1e6] pl-2">
                    {item.children.map((child) => {
                      const childActive = child.match
                        ? child.match(pathname, search)
                        : false;
                      const ChildIcon = child.icon;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                              childActive
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
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-[#dde1e6] px-4 py-3 text-[11px] text-[#6b7280]">
        Real HR Simulation
      </div>
    </aside>
  );
}
