import Link from "next/link";

const TABS = [
  { href: "/reports/workforce-brief", label: "The Workforce Brief" },
  { href: "/reports/balance-sheet", label: "Balance Sheet" },
  { href: "/reports/profit-loss", label: "Profit & Loss Statement" },
  { href: "/reports/cash-flow", label: "Cash Flow Statement" },
  { href: "/reports/financial-ratios", label: "Financial Ratios" },
] as const;

export function ReportsSubnav({ activeHref }: { activeHref: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--portal-sidebar-border)] pb-3">
      {TABS.map((t) => {
        const active = activeHref.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
                : "text-[var(--portal-muted)] hover:bg-white hover:text-[var(--portal-ink)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
