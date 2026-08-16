"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Landmark,
  LineChart,
  Wallet,
} from "lucide-react";

export const REPORT_TABS = [
  {
    href: "/reports/workforce-brief",
    label: "The Workforce Brief",
    icon: FileText,
  },
  {
    href: "/reports/balance-sheet",
    label: "Balance Sheet",
    icon: Landmark,
  },
  {
    href: "/reports/profit-loss",
    label: "Profit & Loss Statement",
    icon: LineChart,
  },
  {
    href: "/reports/cash-flow",
    label: "Cash Flow Statement",
    icon: Wallet,
  },
  {
    href: "/reports/financial-ratios",
    label: "Financial Ratio Reports",
    icon: BarChart3,
  },
] as const;

export function isReportsEnvironment(pathname: string) {
  return (
    pathname.startsWith("/reports") ||
    /\/round\/[^/]+\/results(?:\/|$)/.test(pathname)
  );
}

export function ReportTabsBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Reports"
      className="fixed inset-x-0 z-30 border-b border-[var(--portal-sidebar-border)] bg-white"
      style={{ top: "var(--portal-topbar-height)" }}
    >
      <div className="flex h-[44px] items-stretch overflow-x-auto px-3 sm:px-5">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/reports/workforce-brief"
              ? pathname.startsWith("/reports/workforce-brief") ||
                pathname.includes("/results") ||
                pathname === "/reports"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex shrink-0 items-center gap-1.5 px-3 text-[0.8125rem] font-semibold whitespace-nowrap ${
                active
                  ? "text-[var(--portal-primary)]"
                  : "text-[var(--portal-ink)] hover:text-[var(--portal-primary)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {tab.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[var(--portal-primary)]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
