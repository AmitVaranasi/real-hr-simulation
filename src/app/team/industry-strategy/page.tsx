import Link from "next/link";
import { CalendarDays, Check, Factory, Globe2, Info, Target, Users } from "lucide-react";
import {
  TeamPageShell,
  economyLabel,
} from "@/components/student/TeamChrome";
import {
  INDUSTRY_OUTLOOK,
  hrImplications,
  strategyPoints,
} from "@/lib/student/industry-strategy-brief";
import { getStudentTeamContext } from "@/lib/student/team-context";

export default async function IndustryStrategyPage() {
  const ctx = await getStudentTeamContext();
  const industry = ctx.team?.industry ?? "your industry";
  const strategy = ctx.team?.strategy ?? "your strategy";
  const roundsTotal = ctx.team?.sessions.rounds_total ?? null;
  const implications = hrImplications(industry, strategy);
  const points = strategyPoints(ctx.team?.strategy);
  const economy = economyLabel(ctx.openRound?.economy_condition);

  return (
    <TeamPageShell ctx={ctx} activeHref="/team/industry-strategy">
      {!ctx.team ? (
        <p className="text-sm text-[var(--portal-muted)]">
          <Link href="/join" className="text-[var(--portal-primary)] hover:underline">
            Join a team
          </Link>{" "}
          to view your industry and strategy brief.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--portal-accent-blue)]/20 bg-[var(--portal-accent-blue-soft)] px-4 py-3 text-sm text-[var(--portal-title)]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]" />
            <p>
              Use this brief before you make HR decisions. It summarizes the
              industry environment and the strategic position your company is
              competing from this round.
            </p>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
              <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Industry Overview
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--portal-ink)]">
                Your team competes in <strong>{industry}</strong>. Industry
                conditions, talent markets, and cost pressure shape how
                recruitment, development, rewards, and culture decisions play out.
              </p>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {INDUSTRY_OUTLOOK.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className="rounded-lg border border-[var(--portal-sidebar-border)] bg-[#fafbfc] px-2.5 py-2.5"
                    >
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${card.iconWrap}`}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                      <p className="mt-2 text-[0.5625rem] font-bold uppercase tracking-wide text-[var(--portal-muted)]">
                        {card.label}
                      </p>
                      <p className={`mt-0.5 text-sm font-bold ${card.valueClass}`}>
                        {card.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
              <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Your Strategy: {strategy}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--portal-ink)]">
                Align the seven HR decision areas with how your company competes.
                A {strategy} position only works if hiring, performance,
                development, and rewards stay consistent with it.
              </p>
              <ul className="mt-4 space-y-2">
                {points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm text-[var(--portal-ink)]"
                  >
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
              <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Key HR Implications for {industry} ({strategy})
              </h2>
              <ul className="mt-4 space-y-2">
                {implications.map((row) => (
                  <li
                    key={row.label}
                    className={`rounded-md border border-[var(--portal-sidebar-border)] border-l-4 bg-[#fafbfc] px-3 py-2 ${row.accent}`}
                  >
                    <p className="text-[0.75rem] font-bold text-[var(--portal-title)]">
                      {row.label}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] leading-snug text-[var(--portal-muted)]">
                      {row.text}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
              <h2 className="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                Current Round Context
              </h2>
              <ul className="mt-4 space-y-3">
                {[
                  {
                    label: "Economic Environment",
                    value: economy,
                    detail:
                      economy === "Normal"
                        ? "Stable economic conditions with moderate market growth."
                        : "Set by your instructor when the round opens.",
                    icon: Globe2,
                  },
                  {
                    label: "Industry Outlook",
                    value: "Favorable",
                    detail: `Expected to grow modestly in ${industry}.`,
                    icon: Factory,
                  },
                  {
                    label: "Workforce Outlook",
                    value: "Competitive",
                    detail: "Talent competition remains moderate.",
                    icon: Users,
                  },
                  {
                    label: "Round",
                    value: ctx.openRound
                      ? `Round ${ctx.openRound.round_number}${
                          roundsTotal ? ` of ${roundsTotal}` : ""
                        }`
                      : "Waiting for instructor",
                    detail: "Submit before the due date to avoid penalties.",
                    icon: CalendarDays,
                  },
                  {
                    label: "Round Due Date",
                    value: "Set by your instructor",
                    detail: "Your instructor controls when the round closes.",
                    icon: Target,
                  },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <li key={row.label} className="flex items-start gap-2.5">
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-accent-blue)]"
                        strokeWidth={1.75}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[var(--portal-title)]">
                          {row.label}:{" "}
                          <span className="font-bold">{row.value}</span>
                        </p>
                        <p className="text-[0.75rem] text-[var(--portal-muted)]">
                          {row.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      )}
    </TeamPageShell>
  );
}
