import Link from "next/link";
import { Briefcase, Building2, GraduationCap, Users } from "lucide-react";

const TABS = [
  { href: "/team", label: "Company Profile", icon: Building2 },
  { href: "/team/members", label: "My Team", icon: Users },
  {
    href: "/team/industry-strategy",
    label: "Industry & Strategy Brief",
    icon: Briefcase,
  },
  {
    href: "/team/instructor",
    label: "Instructor Information",
    icon: GraduationCap,
  },
] as const;

export function TeamSubnav({ activeHref }: { activeHref: string }) {
  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-[var(--portal-sidebar-border)]">
      {TABS.map((t) => {
        const active = t.href === activeHref;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-[var(--portal-brand)] font-semibold text-[var(--portal-brand)]"
                : "border-transparent text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
