import Link from "next/link";

export function ProfessorPageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--portal-muted)]">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 ? <span>›</span> : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-[var(--portal-accent-blue)] hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-[var(--portal-ink)]">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-title)] sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-3xl text-sm text-[var(--portal-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}

export function ProfessorStubPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-dashed border-[var(--portal-sidebar-border)] bg-white p-5 text-sm text-[var(--portal-muted)] shadow-sm">
      <h2 className="mb-2 text-base font-semibold text-[var(--portal-title)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ProfessorCardGrid({
  items,
}: {
  items: Array<{ title: string; body: string; href?: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const inner = (
          <>
            <h2 className="font-semibold text-[var(--portal-title)]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--portal-muted)]">{item.body}</p>
          </>
        );
        if (item.href) {
          return (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm transition hover:border-[var(--portal-accent-blue)]"
            >
              {inner}
            </Link>
          );
        }
        return (
          <div
            key={item.title}
            className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
