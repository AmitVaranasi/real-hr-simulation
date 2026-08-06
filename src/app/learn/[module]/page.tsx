import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PRE_SIM_MODULES, type PreSimSlug } from "@/lib/student/pre-sim-content";

export function generateStaticParams() {
  return Object.keys(PRE_SIM_MODULES).map((module) => ({ module }));
}

export default async function PreSimModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const content = PRE_SIM_MODULES[module as PreSimSlug];
  if (!content) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--portal-primary)] hover:underline"
      >
        ← Back to Real HR Simulation
      </Link>

      <header className="mt-6 border-b border-[var(--portal-sidebar-border)] pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-primary)]">
          Pre-Simulation Learning
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--portal-title)]">{content.title}</h1>
        <p className="mt-2 text-lg text-[var(--portal-muted)]">{content.subtitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-[var(--portal-ink)]">
          {content.intro}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-[var(--portal-title)]">
          1. What Is {content.title}?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--portal-ink)]">
          {content.whatIs}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-[var(--portal-title)]">
          2. Why Does It Matter?
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {content.whyCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm"
            >
              <h3 className="font-semibold text-[var(--portal-title)]">{card.title}</h3>
              <p className="mt-2 text-sm text-[var(--portal-muted)]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-[var(--portal-title)]">
          3. Decisions You May Encounter
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--portal-ink)]">
          {content.decisions.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl border border-[var(--portal-primary)]/30 bg-[var(--portal-primary-soft)] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--portal-primary)]">
            Think Like an HR Leader
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--portal-ink)]">
            {content.thinkLike}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-[var(--portal-title)]">
          4. Connecting to the Organization
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--portal-ink)]">
          {content.connecting}
        </p>
        <p className="mt-4 text-sm font-medium text-[var(--portal-title)]">
          {content.pathway}
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/">
          <Button variant="outline">Back to landing</Button>
        </Link>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    </div>
  );
}
