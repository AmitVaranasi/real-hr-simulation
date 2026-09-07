"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileText,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  type CourseRailState,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import {
  DonutScore,
  FilterCard,
  RankBadge,
  ViewByToggle,
} from "@/components/instructor/ClassPerformanceShared";
import {
  DECISION_AREAS,
  avg,
  fmtScore,
  type PerformanceTeam,
  type ScoreRow,
  type SpendRow,
} from "@/lib/instructor/class-performance-data";
import { formatCurrency } from "@/lib/utils";

type RoundOpt = { id: string; label: string; status: string };

export function IndustryResultsHub({
  sessionId,
  rail,
  teams,
  rounds,
  scores,
  spends,
  completedRounds,
  practiceRounds,
  competitiveRounds,
  budgetLabel,
}: {
  sessionId: string;
  rail: CourseRailState;
  teams: PerformanceTeam[];
  rounds: RoundOpt[];
  scores: ScoreRow[];
  spends: SpendRow[];
  completedRounds: number;
  practiceRounds: number;
  competitiveRounds: number;
  budgetLabel: string;
}) {
  const closed = rounds.filter((r) => r.status === "closed");
  const defaultRound =
    closed[closed.length - 1]?.id ?? rounds[0]?.id ?? "";
  const [roundId, setRoundId] = useState(defaultRound);
  const [industry, setIndustry] = useState("all");
  const [strategy, setStrategy] = useState("all");
  const [viewBy, setViewBy] = useState("bsc");

  const focus = rounds.find((r) => r.id === roundId) ?? rounds[0] ?? null;
  const industries = [...new Set(teams.map((t) => t.industry).filter(Boolean))];
  const strategies = [...new Set(teams.map((t) => t.strategy).filter(Boolean))];

  const visibleTeams = useMemo(
    () =>
      teams.filter((t) => {
        if (industry !== "all" && t.industry !== industry) return false;
        if (strategy !== "all" && t.strategy !== strategy) return false;
        return true;
      }),
    [industry, strategy, teams]
  );

  const roundScores = scores.filter((s) => s.roundId === focus?.id);
  const submitted = spends.filter(
    (s) => s.roundId === focus?.id && s.submitted
  ).length;

  const classAvg = {
    overall: avg(
      visibleTeams.map(
        (t) => roundScores.find((s) => s.teamId === t.id)?.overall ?? null
      )
    ),
    financial: avg(
      visibleTeams.map(
        (t) => roundScores.find((s) => s.teamId === t.id)?.financial ?? null
      )
    ),
    employee: avg(
      visibleTeams.map(
        (t) => roundScores.find((s) => s.teamId === t.id)?.employee ?? null
      )
    ),
    process: avg(
      visibleTeams.map(
        (t) => roundScores.find((s) => s.teamId === t.id)?.process ?? null
      )
    ),
    learning: avg(
      visibleTeams.map(
        (t) => roundScores.find((s) => s.teamId === t.id)?.learning ?? null
      )
    ),
  };

  const trend = rounds
    .filter((r) => r.status === "closed")
    .map((r) => ({
      name: r.label,
      score: avg(
        scores.filter((s) => s.roundId === r.id).map((s) => s.overall)
      ),
    }));

  const ranked = [...visibleTeams]
    .map((team) => {
      const score = roundScores.find((s) => s.teamId === team.id);
      const spend = spends.find(
        (s) => s.teamId === team.id && s.roundId === focus?.id
      );
      return { team, score, spend };
    })
    .sort((a, b) => (b.score?.overall ?? -1) - (a.score?.overall ?? -1));

  const inspectHref = `/sessions/${sessionId}/inspect`;
  const analyticsHref = "/sessions/class-performance/analytics";

  return (
    <ProfessorPageGrid
      rail={
        <ProfessorStandardRail
          toolsTitle="Performance Tools"
          course={rail}
          tools={[
            {
              title: "Team Reports",
              icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
              body: "View detailed reports for individual teams.",
              action: "View Reports",
              href: analyticsHref,
            },
            {
              title: "Download Data",
              icon: <Download className="h-4 w-4" strokeWidth={1.75} />,
              body: "Export performance data for analysis.",
              action: "Export Data",
              href: analyticsHref,
            },
            {
              title: "Rubric & Scoring",
              icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
              body: "Review scoring models and evaluation rubrics.",
              action: "View Rubrics",
              href: inspectHref,
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title="Industry Results"
        subtitle="View class results across rounds and analyze workforce performance."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance", href: "/sessions/class-performance" },
          { label: "Industry Results" },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={analyticsHref}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Link>
            <Link
              href={analyticsHref}
              className="rounded-md bg-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-white"
            >
              Generate Report
            </Link>
          </div>
        }
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Teams",
            value: String(teams.length),
            hint: "In this session",
            icon: <Users className="h-4 w-4" />,
            iconWrap:
              "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
          },
          {
            label: "Rounds Completed",
            value: String(completedRounds),
            hint: `of ${practiceRounds} Practice + ${competitiveRounds} Competitive`,
            icon: <CheckCircle2 className="h-4 w-4" />,
            iconWrap: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Decisions Submitted",
            value: focus ? `${submitted} / ${teams.length}` : "—",
            hint: "This Round",
            icon: <BarChart3 className="h-4 w-4" />,
            iconWrap: "bg-violet-50 text-violet-700",
          },
          {
            label: "Discretionary HR Budget",
            value: budgetLabel,
            hint: "Per Team",
            icon: <CircleDollarSign className="h-4 w-4" />,
            iconWrap: "bg-orange-50 text-[var(--portal-brand)]",
          },
        ].map((tile) => (
          <section
            key={tile.label}
            className="flex items-start gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-3.5 py-3 shadow-sm"
          >
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tile.iconWrap}`}
            >
              {tile.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[0.5625rem] font-bold uppercase tracking-wide text-[var(--portal-title)]">
                {tile.label}
              </p>
              <p className="mt-0.5 text-xl font-bold leading-none text-[var(--portal-title)]">
                {tile.value}
              </p>
              <p className="mt-1 text-[0.625rem] text-[var(--portal-title)]">
                {tile.hint}
              </p>
            </div>
          </section>
        ))}
      </div>

      <div className="grid items-end gap-3 rounded-xl border border-[var(--portal-sidebar-border)] bg-[#f8f9fb] px-3 py-3 md:grid-cols-4">
        <FilterCard
          variant="field"
          label="Round"
          value={roundId}
          onChange={setRoundId}
        >
          {rounds.length === 0 ? <option value="">No rounds</option> : null}
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
              {r.status === "open" ? " (Open)" : ""}
            </option>
          ))}
        </FilterCard>
        <FilterCard
          variant="field"
          label="Industry"
          value={industry}
          onChange={setIndustry}
        >
          <option value="all">All Industries</option>
          {industries.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </FilterCard>
        <FilterCard
          variant="field"
          label="Strategy"
          value={strategy}
          onChange={setStrategy}
        >
          <option value="all">All Strategies</option>
          {strategies.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FilterCard>
        <div>
          <p className="mb-1 text-[0.625rem] font-bold text-[var(--portal-title)]">
            View by
          </p>
          <ViewByToggle
            value={viewBy}
            onChange={setViewBy}
            options={[
              { id: "bsc", label: "Balanced Scorecard" },
              { id: "financial", label: "Financial" },
              { id: "employee", label: "Employee" },
              { id: "process", label: "Process" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Average Balanced Scorecard
          </h2>
          <p className="text-[0.6875rem] text-[var(--portal-muted)]">
            (Class Average)
          </p>
          <div className="mt-4">
            <DonutScore
              overall={classAvg.overall}
              slices={[
                { label: "Financial", value: classAvg.financial, color: "#FF560F" },
                { label: "Employee", value: classAvg.employee, color: "#2F6FED" },
                {
                  label: "Learning & Growth",
                  value: classAvg.learning,
                  color: "#16a34a",
                },
                {
                  label: "Internal Process",
                  value: classAvg.process,
                  color: "#7c3aed",
                },
              ]}
            />
          </div>
          <Link
            href="/sessions/class-performance/team-comparison"
            className="mt-4 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View Detailed Metrics
          </Link>
        </section>

        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Round Average Trend
          </h2>
          <div className="mt-4 h-48">
            {trend.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-[var(--portal-muted)]">
                Process a round to plot class averages.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid stroke="#eef1f4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2F6FED"
                    strokeWidth={2}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <Link
            href={analyticsHref}
            className="mt-2 inline-block text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            View Trend Details
          </Link>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Team Performance Summary
          </h2>
          <p className="text-[0.6875rem] text-[var(--portal-muted)]">
            ({focus?.label ?? "—"})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Rank</th>
                <th className="px-4 py-3 whitespace-nowrap">Team</th>
                <th className="px-4 py-3 whitespace-nowrap">Industry</th>
                <th className="px-4 py-3 whitespace-nowrap">Strategy</th>
                {viewBy === "bsc" || viewBy === "financial" ? (
                  <th className="px-4 py-3 whitespace-nowrap">Financial</th>
                ) : null}
                {viewBy === "bsc" || viewBy === "employee" ? (
                  <th className="px-4 py-3 whitespace-nowrap">Employee</th>
                ) : null}
                {viewBy === "bsc" ? (
                  <th className="px-4 py-3 whitespace-nowrap">Learning & Growth</th>
                ) : null}
                {viewBy === "bsc" || viewBy === "process" ? (
                  <th className="px-4 py-3 whitespace-nowrap">Internal Process</th>
                ) : null}
                <th className="px-4 py-3 whitespace-nowrap">Overall Score</th>
                <th className="px-4 py-3 whitespace-nowrap">Decisions Submitted</th>
                <th className="px-4 py-3 whitespace-nowrap">Budget Used</th>
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-[var(--portal-muted)]"
                  >
                    No teams in this session.
                  </td>
                </tr>
              ) : (
                ranked.map((row, i) => (
                  <tr
                    key={row.team.id}
                    className="border-t border-[var(--portal-sidebar-border)]"
                  >
                    <td className="px-4 py-3">
                      <RankBadge
                        rank={row.score?.overall == null ? null : i + 1}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold">{row.team.name}</td>
                    <td className="px-4 py-3">{row.team.industry}</td>
                    <td className="px-4 py-3">{row.team.strategy}</td>
                    {viewBy === "bsc" || viewBy === "financial" ? (
                      <td className="px-4 py-3 tabular-nums">
                        {fmtScore(row.score?.financial)}
                      </td>
                    ) : null}
                    {viewBy === "bsc" || viewBy === "employee" ? (
                      <td className="px-4 py-3 tabular-nums">
                        {fmtScore(row.score?.employee)}
                      </td>
                    ) : null}
                    {viewBy === "bsc" ? (
                      <td className="px-4 py-3 tabular-nums">
                        {fmtScore(row.score?.learning)}
                      </td>
                    ) : null}
                    {viewBy === "bsc" || viewBy === "process" ? (
                      <td className="px-4 py-3 tabular-nums">
                        {fmtScore(row.score?.process)}
                      </td>
                    ) : null}
                    <td className="px-4 py-3 tabular-nums">
                      {fmtScore(row.score?.overall)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.spend
                        ? `${
                            DECISION_AREAS.filter(
                              (a) => row.spend?.areas[a.key] != null
                            ).length
                          }/${DECISION_AREAS.length}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.score?.budgetSpent != null
                        ? formatCurrency(row.score.budgetSpent)
                        : row.spend?.total != null
                          ? formatCurrency(row.spend.total)
                          : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ProfessorHelpBanner
        title="Results are based on the latest processed round. Close and compute a round to update results."
        body="Scores come from the engine, not this page."
        href={`/sessions/${sessionId}/rounds`}
        action="Go to Round Management"
      />
    </ProfessorPageGrid>
  );
}
