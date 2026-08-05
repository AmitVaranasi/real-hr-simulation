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
    <div className="mb-6 flex flex-wrap gap-2 border-b border-[#dde1e6] pb-3">
      {TABS.map((t) => {
        const active = activeHref.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-[#fff4e8] text-[#c45f12]"
                : "text-[#6b7280] hover:bg-white hover:text-[#1f2937]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
