import Link from "next/link";

const TABS = [
  { href: "/team", label: "Company Profile" },
  { href: "/team/members", label: "My Team" },
  { href: "/team/industry-strategy", label: "Industry & Strategy Brief" },
  { href: "/team/instructor", label: "Instructor Information" },
] as const;

export function TeamSubnav({ activeHref }: { activeHref: string }) {
  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-[var(--portal-sidebar-border)]">
      {TABS.map((t) => {
        const active = t.href === activeHref;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-[var(--portal-brand)] font-semibold text-[var(--portal-brand)]"
                : "border-transparent text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
