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
        <section className="rounded-xl border border-[#dde1e6] bg-white p-6 text-sm text-[#6b7280]">
          Join a company team to view your organizational profile.{" "}
          <Link href="/join" className="font-medium text-[#e67e22] hover:underline">
            Join Session →
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#e67e22]">
              Our Company
            </h2>
            <p className="mt-2 text-2xl font-bold text-[#0f172a]">{team.name}</p>
            <p className="mt-2 text-sm text-[#6b7280]">
              Course: {team.sessions.name}
              {team.sessions.course_code ? ` · ${team.sessions.course_code}` : ""}
              {team.sessions.semester ? ` · ${team.sessions.semester}` : ""}
            </p>
            <p className="mt-3 text-sm text-[#1f2937]">
              Join code:{" "}
              <span className="font-mono font-semibold">{team.join_code}</span>
            </p>
          </section>

          <section className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#e67e22]">
              Company Snapshot
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[#6b7280]">Headcount</dt>
                <dd className="font-semibold text-[#0f172a]">
                  {team.headcount ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Revenue</dt>
                <dd className="font-semibold text-[#0f172a]">
                  {team.revenue != null ? formatCurrency(team.revenue) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Stock Price</dt>
                <dd className="font-semibold text-[#0f172a]">
                  {team.stock_price != null
                    ? `$${Number(team.stock_price).toFixed(2)}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Market Share</dt>
                <dd className="font-semibold text-[#0f172a]">
                  {team.market_share != null
                    ? formatPercent(team.market_share)
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#e67e22]">
              Current Round Context
            </h2>
            <p className="mt-2 text-sm text-[#1f2937]">
              {ctx.openRound
                ? `Round ${ctx.openRound.round_number} is ${ctx.openRound.status}. Economy: ${ctx.openRound.economy_condition ?? "—"}.`
                : "No round is currently open. Waiting for your instructor."}
            </p>
          </section>

          <section className="rounded-xl border border-[#dde1e6] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#e67e22]">
              Company Values
            </h2>
            <p className="mt-2 text-sm text-[#6b7280]">
              Align HR decisions with your industry environment and chosen strategy.
              Detailed values content will expand as instructional materials are finalized.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
