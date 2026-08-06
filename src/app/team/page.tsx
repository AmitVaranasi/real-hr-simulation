import Link from "next/link";
import {
  SimulationContextStrip,
  StudentPageHeader,
} from "@/components/student/shell/StudentShell";
import { TeamSubnav } from "@/components/student/TeamSubnav";
import { getStudentTeamContext } from "@/lib/student/team-context";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function TeamCompanyPage() {
  const ctx = await getStudentTeamContext();
  const team = ctx.team;

  return (
    <div>
      <StudentPageHeader
        title="Team & Company"
        subtitle="Learn about your simulated company, your team, and key context for this round."
      />
      <SimulationContextStrip
        items={[
          ctx.openRound
            ? `Round ${ctx.openRound.round_number} – ${ctx.openRound.status.toUpperCase()}`
            : "No open round",
          team?.industry,
          team?.strategy,
          ctx.openRound?.economy_condition
            ? ctx.openRound.economy_condition.charAt(0).toUpperCase() +
              ctx.openRound.economy_condition.slice(1)
            : null,
        ]}
      />
      <TeamSubnav activeHref="/team" />

      {!team ? (
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-6 text-sm text-[var(--portal-muted)]">
          Join a company team to view your organizational profile.{" "}
          <Link
            href="/join"
            className="font-medium text-[var(--portal-primary)] hover:underline"
          >
            Join Session →
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-primary)]">
              Our Company
            </h2>
            <p className="mt-2 text-2xl font-bold text-[var(--portal-title)]">
              {team.name}
            </p>
            <p className="mt-2 text-sm text-[var(--portal-muted)]">
              Course: {team.sessions.name}
              {team.sessions.course_code ? ` · ${team.sessions.course_code}` : ""}
              {team.sessions.semester ? ` · ${team.sessions.semester}` : ""}
            </p>
            <p className="mt-3 text-sm text-[var(--portal-ink)]">
              Join code:{" "}
              <span className="font-mono font-semibold">{team.join_code}</span>
            </p>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-primary)]">
              Company Snapshot
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--portal-muted)]">Headcount</dt>
                <dd className="font-semibold text-[var(--portal-title)]">
                  {team.headcount ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--portal-muted)]">Revenue</dt>
                <dd className="font-semibold text-[var(--portal-title)]">
                  {team.revenue != null ? formatCurrency(team.revenue) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--portal-muted)]">Stock Price</dt>
                <dd className="font-semibold text-[var(--portal-title)]">
                  {team.stock_price != null
                    ? `$${Number(team.stock_price).toFixed(2)}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--portal-muted)]">Market Share</dt>
                <dd className="font-semibold text-[var(--portal-title)]">
                  {team.market_share != null
                    ? formatPercent(team.market_share)
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-primary)]">
              Current Round Context
            </h2>
            <p className="mt-2 text-sm text-[var(--portal-ink)]">
              {ctx.openRound
                ? `Round ${ctx.openRound.round_number} is ${ctx.openRound.status}. Economy: ${ctx.openRound.economy_condition ?? "—"}.`
                : "No round is currently open. Waiting for your instructor."}
            </p>
          </section>

          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-primary)]">
              Company Values
            </h2>
            <p className="mt-2 text-sm text-[var(--portal-muted)]">
              Align HR decisions with your industry environment and chosen strategy.
              Detailed values content will expand as instructional materials are finalized.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
