import Link from "next/link";
import {
  BarChart3,
  Briefcase,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Network,
  Scale,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const features: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: Users,
    title: "Team-based decisions",
    description:
      "Teams of 4–5 students submit one collective HR decision each round across seven modules.",
  },
  {
    icon: Wallet,
    title: "$500K discretionary budget",
    description:
      "Allocate spend across recruitment, training, compensation, DEI, and more with live budget tracking.",
  },
  {
    icon: BarChart3,
    title: "Balanced Scorecard",
    description:
      "Scores on Financial, Employee, Process, and Learning perspectives — 100 points per round.",
  },
  {
    icon: GraduationCap,
    title: "SHRM BASK aligned",
    description:
      "Each module maps to SHRM BASK competency areas for accredited HR education.",
  },
];

const MODULES: Array<{
  slug: string;
  title: string;
  icon: LucideIcon;
}> = [
  { slug: "recruitment", title: "Recruitment & Selection", icon: UserPlus },
  { slug: "performance", title: "Performance Management", icon: Briefcase },
  { slug: "training", title: "Training & Development", icon: GraduationCap },
  { slug: "relations", title: "Employee Relations", icon: HeartHandshake },
  { slug: "compensation", title: "Compensation & Benefits", icon: Wallet },
  { slug: "org-design", title: "Org Design & Change", icon: Network },
  { slug: "dei", title: "DEI Initiatives", icon: Scale },
];

export default function Home() {
  return (
    <div className="w-full min-w-0 overflow-x-hidden bg-white">
      <section className="border-b border-[var(--portal-sidebar-border)]">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-14 text-center sm:pb-16 sm:pt-16">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--portal-brand)]">
            Higher Education Business Simulation
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--portal-title)] sm:text-5xl md:text-[58px] md:leading-tight">
            Real HR Simulation
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#24365a] sm:text-[19px]">
            An HR business simulation where student teams make recruitment,
            compensation, training, and engagement decisions — then see how those
            choices affect workforce metrics, financial outcomes, and the Balanced
            Scorecard.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/simulate"
              className="inline-flex h-[55px] items-center justify-center rounded-xl bg-[var(--portal-brand)] px-8 text-[17px] font-bold text-white hover:bg-[var(--portal-brand-hover)]"
            >
              Try the simulation
            </Link>
            <Link
              href="/login"
              className="inline-flex h-[55px] items-center justify-center rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-10 text-[17px] font-bold text-[var(--portal-title)] hover:bg-[#f8fafc]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-14">
        <h2 className="text-center text-[29px] font-bold text-[var(--portal-title)]">
          Why Real HR Simulation?
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-5 py-6"
              >
                <Icon className="h-9 w-9 text-[var(--portal-brand)]" strokeWidth={1.75} />
                <h3 className="mt-5 text-base font-bold text-[var(--portal-title)]">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#24365a]">
                  {f.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-5xl px-4 pb-16 scroll-mt-20">
        <h2 className="text-center text-[29px] font-bold text-[var(--portal-title)]">
          Seven HR Decision Modules
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] text-[#24365a]">
          Explore each module to see how your team&apos;s decisions drive real
          organizational outcomes.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {MODULES.slice(0, 6).map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.slug}
                href={`/learn/${m.slug}`}
                className="flex items-center gap-4 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-5 py-5 transition hover:border-[var(--portal-brand)]/40 hover:bg-[var(--portal-brand-soft)]/40"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-[var(--portal-brand)]">
                  <Icon className="h-8 w-8" strokeWidth={1.75} />
                </span>
                <span className="flex-1 text-base font-bold text-[var(--portal-title)]">
                  {m.title}
                </span>
                <ChevronRight className="h-6 w-6 text-[var(--portal-title)]" />
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center">
          <Link
            href={`/learn/${MODULES[6].slug}`}
            className="flex w-full max-w-[487px] items-center gap-4 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-5 py-5 transition hover:border-[var(--portal-brand)]/40 hover:bg-[var(--portal-brand-soft)]/40 sm:w-[487px]"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-[var(--portal-brand)]">
              <Scale className="h-8 w-8" strokeWidth={1.75} />
            </span>
            <span className="flex-1 text-base font-bold text-[var(--portal-title)]">
              {MODULES[6].title}
            </span>
            <ChevronRight className="h-6 w-6 text-[var(--portal-title)]" />
          </Link>
        </div>

        <p className="mt-12 text-center">
          <Link
            href="/about"
            className="text-[17px] text-[var(--portal-brand)] hover:underline"
          >
            About this application
          </Link>
        </p>
      </section>
    </div>
  );
}
