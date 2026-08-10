import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Check,
  Factory,
  Globe2,
  Heart,
  MapPin,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { StudentPageHeader } from "@/components/student/shell/StudentShell";
import { TeamSubnav } from "@/components/student/TeamSubnav";
import { getStudentTeamContext } from "@/lib/student/team-context";
import { formatCurrency, formatPercent } from "@/lib/utils";

const COMPANY_VALUES = [
  {
    title: "Quality First",
    body: "Deliver excellence in products, services, and workforce practices.",
    icon: Sparkles,
    color: "text-[var(--portal-icon-blue)]",
    bg: "bg-blue-50",
  },
  {
    title: "People & Respect",
    body: "Treat employees with dignity and invest in their growth.",
    icon: Heart,
    color: "text-[var(--portal-icon-orange)]",
    bg: "bg-[var(--portal-brand-soft)]",
  },
  {
    title: "Integrity",
    body: "Make transparent, ethical decisions under competitive pressure.",
    icon: Shield,
    color: "text-[var(--portal-icon-green)]",
    bg: "bg-emerald-50",
  },
  {
    title: "Continuous Improvement",
    body: "Learn from each round and refine your HR strategy.",
    icon: TrendingUp,
    color: "text-[var(--portal-icon-purple)]",
    bg: "bg-violet-50",
  },
  {
    title: "Customer Focus",
    body: "Align workforce capability with customer and market needs.",
    icon: Users,
    color: "text-[var(--portal-icon-blue)]",
    bg: "bg-blue-50",
  },
];

export default async function TeamCompanyPage() {
  const ctx = await getStudentTeamContext();
  const team = ctx.team;
  const economy = ctx.openRound?.economy_condition
    ? ctx.openRound.economy_condition.charAt(0).toUpperCase() +
      ctx.openRound.economy_condition.slice(1)
    : "—";

  const statusCards = [
    {
      label: "Round",
      icon: CalendarDays,
      iconClass: "text-[var(--portal-icon-blue)]",
      value: ctx.openRound
        ? `Round ${ctx.openRound.round_number}`
        : "No Round Open",
      badge: ctx.openRound ? ctx.openRound.status.toUpperCase() : null,
    },
    {
      label: "Industry",
      icon: Factory,
      iconClass: "text-[var(--portal-icon-green)]",
      value: team?.industry ?? "—",
    },
    {
      label: "Strategy",
      icon: Target,
      iconClass: "text-[var(--portal-icon-orange)]",
      value: team?.strategy ?? "—",
    },
    {
      label: "Economy",
      icon: Globe2,
      iconClass: "text-[var(--portal-icon-purple)]",
      value: economy,
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[1200px] pb-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <StudentPageHeader
          title="Team & Company"
          subtitle="Learn about your simulated company, your team, and key context for this round."
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {statusCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="min-w-[120px] rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2 shadow-sm"
              >
                <p className="flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                  <Icon className={`h-3 w-3 ${card.iconClass}`} strokeWidth={2} />
                  {card.label}
                </p>
                <p className="mt-0.5 text-[0.8125rem] font-semibold text-[var(--portal-ink)]">
                  {card.value}
                  {card.badge ? (
                    <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[0.625rem] font-bold text-emerald-700">
                      {card.badge}
                    </span>
                  ) : null}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <TeamSubnav activeHref="/team" />

      {!team ? (
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 text-sm text-[var(--portal-muted)]">
          Join a company team to view your organizational profile.{" "}
          <Link
            href="/join"
            className="font-medium text-[var(--portal-accent-blue)] hover:underline"
          >
            Join Session →
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Our Company
            </h2>
            <p className="mt-2 text-2xl font-bold text-[var(--portal-title)]">
              {team.name}
            </p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              {team.industry ?? "—"} · {team.strategy ?? "—"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--portal-ink)]">
              Your team manages HR strategy for this simulated organization.
              Industry conditions and your chosen strategy shape how recruitment,
              development, rewards, and culture decisions play out each round.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--portal-sidebar-border)] pt-4 sm:grid-cols-4">
              {[
                { label: "Founded", value: "2015", icon: CalendarDays },
                { label: "Company Size", value: "Mid-Market", icon: Building2 },
                { label: "Headquarters", value: "Chicago, IL", icon: MapPin },
                { label: "Markets Served", value: "North America", icon: Globe2 },
              ].map((meta) => {
                const Icon = meta.icon;
                return (
                  <div key={meta.label} className="text-center">
                    <Icon
                      className="mx-auto h-4 w-4 text-[var(--portal-accent-blue)]"
                      strokeWidth={1.75}
                    />
                    <p className="mt-1 text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                      {meta.label}
                    </p>
                    <p className="text-xs font-semibold text-[var(--portal-title)]">
                      {meta.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Company Snapshot
              {ctx.openRound ? ` (Round ${ctx.openRound.round_number})` : ""}
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Total Employees",
                  value: team.headcount ?? "—",
                  icon: Users,
                  iconClass: "text-[var(--portal-icon-blue)]",
                },
                {
                  label: "Annual Revenue",
                  value:
                    team.revenue != null ? formatCurrency(team.revenue) : "—",
                  icon: TrendingUp,
                  iconClass: "text-[var(--portal-icon-green)]",
                },
                {
                  label: "Operating Profit",
                  value:
                    team.profit_margin != null
                      ? formatPercent(team.profit_margin)
                      : "—",
                  icon: Target,
                  iconClass: "text-[var(--portal-icon-purple)]",
                },
                {
                  label: "Stock Price",
                  value:
                    team.stock_price != null
                      ? `$${Number(team.stock_price).toFixed(2)}`
                      : "—",
                  icon: Sparkles,
                  iconClass: "text-[var(--portal-icon-orange)]",
                },
                {
                  label: "HR Budget",
                  value: "$500,000",
                  icon: Building2,
                  iconClass: "text-[var(--portal-icon-blue)]",
                },
                {
                  label: "Market Share",
                  value:
                    team.market_share != null
                      ? formatPercent(team.market_share)
                      : "—",
                  icon: Factory,
                  iconClass: "text-[var(--portal-icon-green)]",
                },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[#fafbfc] px-3 py-3"
                  >
                    <dt className="flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                      <Icon className={`h-3 w-3 ${row.iconClass}`} strokeWidth={2} />
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-lg font-bold text-[var(--portal-title)]">
                      {row.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-3 rounded-lg bg-[var(--portal-accent-blue-soft)] px-3 py-2 text-[0.6875rem] text-[var(--portal-title)]">
              Snapshot values reflect the most recent completed round (or starting
              conditions before results exist).
            </p>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Current Round Context
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {[
                {
                  label: "Round",
                  value: ctx.openRound
                    ? `${ctx.openRound.round_number} (${ctx.openRound.status})`
                    : "Waiting for instructor",
                  icon: CalendarDays,
                },
                {
                  label: "Economic Environment",
                  value: economy,
                  icon: Globe2,
                },
                {
                  label: "Industry",
                  value: team.industry ?? "—",
                  icon: Factory,
                },
                {
                  label: "Strategy",
                  value: team.strategy ?? "—",
                  icon: Target,
                },
                {
                  label: "Round Due Date",
                  value: "Set by your instructor",
                  icon: CalendarDays,
                },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <li key={row.label} className="flex items-start gap-2.5">
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]"
                      strokeWidth={1.75}
                    />
                    <span>
                      <span className="font-semibold text-[var(--portal-title)]">
                        {row.label}:{" "}
                      </span>
                      <span className="text-[var(--portal-ink)]">{row.value}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
              Company Values
            </h2>
            <ul className="mt-3 space-y-3">
              {COMPANY_VALUES.map((v) => {
                const Icon = v.icon;
                return (
                  <li key={v.title} className="flex items-start gap-3">
                    <div className={`rounded-md p-1.5 ${v.bg} ${v.color}`}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--portal-title)]">
                        {v.title}
                      </p>
                      <p className="text-[0.75rem] text-[var(--portal-muted)]">
                        {v.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[var(--portal-sidebar-border)] bg-white/95 backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-[var(--portal-accent-blue)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)] hover:bg-[var(--portal-accent-blue-soft)]"
          >
            ← Back to Dashboard
          </Link>
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            All changes auto-saved
          </p>
          <button
            type="button"
            className="rounded-md bg-[var(--portal-accent-blue)] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save Now
          </button>
        </div>
      </div>
    </div>
  );
}
