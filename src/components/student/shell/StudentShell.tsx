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
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-[var(--portal-title)] sm:text-3xl">
            {title}
          </h1>
          {badge ? (
            <span className="rounded-full border border-[var(--portal-sidebar-border)] bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-accent-blue)]">
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
  const cells = [
    { label: "Company", value: company },
    { label: "Course", value: course },
    { label: "Industry", value: industry },
    { label: "Strategy", value: strategy },
    { label: "Current Round", value: roundLabel },
  ];
  return (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--portal-primary)]">
        Your Simulation
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[#f8fafc] px-3 py-2"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              {c.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--portal-title)]">
              {c.value}
            </p>
          </div>
        ))}
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
