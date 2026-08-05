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
          <h1 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">
            {title}
          </h1>
          {badge ? (
            <span className="rounded-full border border-[#dde1e6] bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2563eb]">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6b7280]">
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
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#dde1e6] bg-white px-3 py-2 text-xs font-medium text-[#1f2937]">
      {filtered.map((item, i) => (
        <span key={`${item}-${i}`} className="inline-flex items-center gap-2">
          {i > 0 ? <span className="text-[#dde1e6]">|</span> : null}
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
    <section className="rounded-xl border border-[#dde1e6] bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-[#e67e22]">
        Your Simulation
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-[#f0f1f3] bg-[#f8f9fb] px-3 py-2"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
              {c.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0f172a]">{c.value}</p>
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
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#fff4e8] text-xs font-bold text-[#e67e22]">
        ●
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
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
    <section className="rounded-xl border border-dashed border-[#dde1e6] bg-white p-6 text-sm text-[#6b7280] shadow-sm">
      {title ? (
        <h2 className="mb-2 text-base font-semibold text-[#0f172a]">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}
