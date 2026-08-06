import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  GraduationCap,
  HeartHandshake,
  Network,
  Scale,
  Users,
  UserPlus,
  Wallet,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

const features = [
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
    <div className="w-full min-w-0 overflow-x-hidden bg-[var(--portal-page)]">
      <section className="border-b border-[var(--portal-sidebar-border)] bg-gradient-to-br from-[var(--portal-primary-soft)] via-white to-[var(--portal-page)]">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-20">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--portal-primary)] sm:text-sm">
            Higher Education Business Simulation
          </p>
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-[var(--portal-primary)] sm:text-5xl">
            Real HR Simulation
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--portal-muted)] sm:text-lg">
            An HR business simulation where student teams make recruitment,
            compensation, training, and engagement decisions — then see how
            those choices affect workforce metrics, financial outcomes, and the
            Balanced Scorecard.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/simulate" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Try the simulation
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-xl font-semibold text-[var(--portal-title)] sm:text-2xl">
            Why Real HR Simulation?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm sm:p-6"
              >
                <f.icon className="mb-3 h-8 w-8 text-[var(--portal-primary)]" />
                <h3 className="font-semibold text-[var(--portal-title)]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          <h2 className="mb-6 mt-14 text-center text-xl font-semibold text-[var(--portal-title)] sm:text-2xl">
            Seven HR Decision Modules
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MODULES.map((m) => (
              <Link
                key={m.slug}
                href={`/learn/${m.slug}`}
                className="rounded-xl border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] px-4 py-4 text-left shadow-sm transition hover:border-[var(--portal-primary)] hover:bg-[var(--portal-primary-soft)]"
              >
                <m.icon className="mb-2 h-6 w-6 text-[var(--portal-primary)]" />
                <p className="text-sm font-semibold text-[var(--portal-title)]">{m.title}</p>
                <p className="mt-1 text-xs text-[var(--portal-primary)]">Learn more →</p>
              </Link>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-[var(--portal-muted)]">
            <Link href="/about" className="text-[var(--portal-primary)] hover:underline">
              About this application
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
