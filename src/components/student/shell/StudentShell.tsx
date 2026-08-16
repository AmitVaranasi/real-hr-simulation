import {
  Building2,
  CalendarDays,
  Factory,
  GraduationCap,
  Target,
  type LucideIcon,
} from "lucide-react";

export function StudentPageHeader({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-[var(--portal-title)] sm:text-3xl">
            {title}
          </h1>
          {badge ? (
            <span className="rounded-full border border-[var(--portal-sidebar-border)] bg-white px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--portal-accent-blue)]">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--portal-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function SimulationContextStrip({
  items,
}: {
  items: Array<string | null | undefined>;
}) {
  const filtered = items.filter(Boolean) as string[];
  if (filtered.length === 0) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--portal-ink)]">
      {filtered.map((item, i) => (
        <span key={`${item}-${i}`} className="inline-flex items-center gap-2">
          {i > 0 ? (
            <span className="text-[var(--portal-sidebar-border)]">|</span>
          ) : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

export function YourSimulationPanel({
  company,
  course,
  industry,
  strategy,
  roundLabel,
}: {
  company: string;
  course: string;
  industry: string;
  strategy: string;
  roundLabel: string;
}) {
  const cells: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    iconClass: string;
  }> = [
    {
      label: "Company",
      value: company,
      icon: Building2,
      iconClass: "text-[var(--portal-primary)]",
    },
    {
      label: "Course",
      value: course,
      icon: GraduationCap,
      iconClass: "text-[var(--portal-purple)]",
    },
    {
      label: "Industry",
      value: industry,
      icon: Factory,
      iconClass: "text-[var(--portal-icon-green)]",
    },
    {
      label: "Strategy",
      value: strategy,
      icon: Target,
      iconClass: "text-[var(--portal-brand)]",
    },
    {
      label: "Current Round",
      value: roundLabel,
      icon: CalendarDays,
      iconClass: "text-[var(--portal-primary)]",
    },
  ];
  return (
    <section className="h-full rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-3 py-3 sm:px-4 sm:py-3.5">
      <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--portal-primary)]">
        Your Simulation
      </p>
      <div className="mt-2.5 grid gap-2 sm:grid-cols-2 md:grid-cols-5 md:gap-0">
        {cells.map((c, index) => {
          const Icon = c.icon;
          // Only split on em/en dash separators (e.g. "Not Open — Waiting…"),
          // never on hyphens inside values like "High-Tech" or "MGMT-GAP".
          const dashParts = c.value.split(/\s+[—–]\s+/);
          const primary = dashParts[0]?.trim() || c.value;
          const secondary =
            dashParts.length > 1 ? dashParts.slice(1).join(" — ").trim() : null;
          return (
            <div
              key={c.label}
              className={`px-1.5 py-0.5 sm:px-2.5 ${
                index > 0 ? "md:border-l md:border-[var(--portal-sidebar-border)]" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 ${c.iconClass}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                    {c.label}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] font-semibold leading-snug text-[var(--portal-title)]">
                    {primary}
                  </p>
                  {secondary ? (
                    <p className="mt-0.5 text-[0.6875rem] leading-snug text-[var(--portal-muted)]">
                      {secondary}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ModuleStatusIcon({
  status,
}: {
  status: "complete" | "current" | "pending";
}) {
  if (status === "complete") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
        ✓
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--portal-primary-soft)] text-xs font-bold text-[var(--portal-primary)]">
        ●
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f1f3f5] text-xs font-bold text-[var(--portal-muted)]">
      ○
    </span>
  );
}

export function PlaceholderPanel({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-dashed border-[var(--portal-sidebar-border)] bg-white p-6 text-sm text-[var(--portal-muted)] shadow-sm">
      {title ? (
        <h2 className="mb-2 text-base font-semibold text-[var(--portal-title)]">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function StudentChromeCard({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        accent
          ? "border-[var(--portal-primary)]/30"
          : "border-[var(--portal-sidebar-border)]"
      }`}
    >
      <h2
        className={`text-sm font-bold uppercase tracking-wide ${
          accent ? "text-[var(--portal-primary)]" : "text-[var(--portal-title)]"
        }`}
      >
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
