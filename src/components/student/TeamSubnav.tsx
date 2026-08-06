import Link from "next/link";

const TABS = [
  { href: "/team", label: "Company Profile" },
  { href: "/team/members", label: "My Team" },
  { href: "/team/industry-strategy", label: "Industry & Strategy Brief" },
  { href: "/team/instructor", label: "Instructor Information" },
] as const;

export function TeamSubnav({ activeHref }: { activeHref: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--portal-sidebar-border)] pb-3">
      {TABS.map((t) => {
        const active = t.href === activeHref;
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
