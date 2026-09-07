"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  Download,
  FileText,
  LineChart as LineChartIcon,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  ProfessorTabBar,
  type CourseRailState,
  plural,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import { FilterCard, KpiBoard } from "@/components/instructor/ClassPerformanceShared";
import {
  avg,
  fmtScore,
  pctDelta,
  type PerformanceTeam,
  type ScoreRow,
} from "@/lib/instructor/class-performance-data";


const PERSPECTIVE_SERIES = [
  { key: "financial", pctKey: "financialPct", label: "Financial", color: "#16a34a" },
  { key: "employee", pctKey: "employeePct", label: "Employee", color: "#2F6FED" },
  { key: "process", pctKey: "processPct", label: "Internal Process", color: "#f97316" },
  { key: "learning", pctKey: "learningPct", label: "Learning & Growth", color: "#7c3aed" },
] as const;

const BAR_PALETTE = ["#16a34a", "#2F6FED", "#f97316", "#7c3aed", "#eab308"];

function pctOf25(value: number | null) {
  return value == null ? null : Math.round((value / 25) * 100);
}

type RoundOpt = { id: string; label: string; status: string };

export function ReportsAnalyticsHub({
  sessionId,
  rail,
  teams,
  rounds,
  scores,
}: {
  sessionId: string;
  rail: CourseRailState;
  teams: PerformanceTeam[];
  rounds: RoundOpt[];
  scores: ScoreRow[];
}) {
  const closed = rounds.filter((r) => r.status === "closed");
  const [roundFilter, setRoundFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [perspective, setPerspective] = useState("all");
  const [tab, setTab] = useState("overall");

  const selectedRounds = useMemo(
    () =>
      roundFilter === "all"
        ? closed
        : closed.filter((r) => r.id === roundFilter),
    [closed, roundFilter]
  );
  const selectedTeams = useMemo(
    () =>
      teamFilter === "all" ? teams : teams.filter((t) => t.id === teamFilter),
    [teamFilter, teams]
  );

  const series = selectedRounds.map((r) => {
    const rows = scores.filter(
      (s) =>
        s.roundId === r.id &&
        selectedTeams.some((t) => t.id === s.teamId)
    );
    return {
      id: r.id,
      name: r.label,
      overall: avg(rows.map((s) => s.overall)),
      financial: avg(rows.map((s) => s.financial)),
      employee: avg(rows.map((s) => s.employee)),
      process: avg(rows.map((s) => s.process)),
      learning: avg(rows.map((s) => s.learning)),
      // Each BSC perspective caps at its 25-point weight, so % = value / 25.
      financialPct: pctOf25(avg(rows.map((s) => s.financial))),
      employeePct: pctOf25(avg(rows.map((s) => s.employee))),
      processPct: pctOf25(avg(rows.map((s) => s.process))),
      learningPct: pctOf25(avg(rows.map((s) => s.learning))),
    };
  });

  const first = series[0];
  const latest = series[series.length - 1];
  const overallTrend = pctDelta(latest?.overall ?? null, first?.overall ?? null);

  const teamDeltas = teams.map((team) => {
    const firstScore = scores.find(
      (s) => s.teamId === team.id && s.roundId === closed[0]?.id
    );
    const lastScore = scores.find(
      (s) =>
        s.teamId === team.id && s.roundId === closed[closed.length - 1]?.id
    );
    const history = closed
      .map((r) => scores.find((s) => s.teamId === team.id && s.roundId === r.id)?.overall)
      .filter((v): v is number => v != null);
    const mean = avg(history);
    const variance =
      mean == null || history.length < 2
        ? null
        : history.reduce((sum, v) => sum + (v - mean) ** 2, 0) / history.length;
    return {
      team,
      delta: pctDelta(lastScore?.overall ?? null, firstScore?.overall ?? null),
      variance,
    };
  });
  const bestImprove = [...teamDeltas]
    .filter((t) => t.delta != null)
    .sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999))[0];
  const mostConsistent = [...teamDeltas]
    .filter((t) => t.variance != null)
    .sort((a, b) => (a.variance ?? 999) - (b.variance ?? 999))[0];

  const inspectHref = `/sessions/${sessionId}/inspect`;
  const reliability =
    closed.length >= 3 ? "High" : closed.length === 2 ? "Medium" : closed.length === 1 ? "Low" : "—";


  /* professor_reports_analytics_editable shows four cards on Overall Performance:
     the two below sit alongside Class Average and Performance Summary. */
  const perspectiveCard = (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-[var(--portal-title)]">
        Performance by Perspective Over Time
      </h2>
      <p className="text-[0.6875rem] text-[var(--portal-muted)]">
        Class average % by Balanced Scorecard perspective
      </p>
      <div className="mt-4 h-56">
        {series.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-[var(--portal-muted)]">
            No processed rounds yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid stroke="#eef1f4" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {PERSPECTIVE_SERIES.filter(
                (ps) => perspective === "all" || perspective === ps.key
              ).map((ps) => (
                <Line
                  key={ps.key}
                  type="monotone"
                  dataKey={ps.pctKey}
                  stroke={ps.color}
                  strokeWidth={2}
                  name={ps.label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );

  const improvingCard = (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-[var(--portal-title)]">
        Top Improving Teams
      </h2>
      <p className="text-[0.6875rem] text-[var(--portal-muted)]">
        Overall score improvement from first to latest completed round
      </p>
      {teamDeltas.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--portal-muted)]">
          No processed rounds yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {[...teamDeltas]
            .sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999))
            .map((row, i) => (
              <li
                key={row.team.id}
                className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm"
              >
                <span className="truncate">{row.team.name}</span>
                <span className="h-2.5 overflow-hidden rounded bg-[#eef1f4]">
                  <span
                    className="block h-full rounded"
                    style={{
                      width: `${Math.min(100, Math.max(4, Math.abs(row.delta ?? 0) * 2.5))}%`,
                      background:
                        (row.delta ?? 0) < 0
                          ? "#ef4444"
                          : BAR_PALETTE[i % BAR_PALETTE.length],
                    }}
                  />
                </span>
                <span className="tabular-nums font-semibold text-[var(--portal-muted)]">
                  {row.delta == null
                    ? "—"
                    : `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(0)}%`}
                </span>
              </li>
            ))}
        </ul>
      )}
    </section>
  );

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
              href: `/sessions/${sessionId}/reports`,
            },
            {
              title: "Download Data",
              icon: <Download className="h-4 w-4" strokeWidth={1.75} />,
              body: "Export trend data for further analysis.",
              action: "Export Data",
              href: `/sessions/${sessionId}/reports`,
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
        title="Reports & Analytics"
        subtitle="Access comprehensive reports and analytics to monitor class performance and support instruction."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance", href: "/sessions/class-performance" },
          { label: "Reports & Analytics" },
        ]}
        actions={
          <Link
            href={`/sessions/${sessionId}/reports`}
            className="rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
          >
            Export Trends
          </Link>
        }
      />

      <div className="grid gap-2 md:grid-cols-4">
        <FilterCard
          label="Rounds"
          value={roundFilter}
          onChange={setRoundFilter}
          hint="Practice + Competitive"
        >
          <option value="all">All Rounds</option>
          {closed.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </FilterCard>
        <FilterCard
          label="Teams"
          value={teamFilter}
          onChange={setTeamFilter}
          hint={plural(teams.length, "Team")}
        >
          <option value="all">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </FilterCard>
        <FilterCard
          label="Perspectives"
          value={perspective}
          onChange={setPerspective}
          hint="Balanced Scorecard"
        >
          <option value="all">All Perspectives</option>
          <option value="financial">Financial</option>
          <option value="employee">Employee</option>
          <option value="process">Internal Process</option>
          <option value="learning">Learning & Growth</option>
        </FilterCard>
        <FilterCard
          label="View By"
          value="progression"
          onChange={() => undefined}
          hint="Round Progression"
        >
          <option value="progression">View By</option>
        </FilterCard>
      </div>

      <KpiBoard
        tiles={[
          {
            label: "Overall Trend",
            value:
              overallTrend == null
                ? "—"
                : `${overallTrend > 0 ? "+" : ""}${overallTrend.toFixed(0)}%`,
            hint: "vs First Round",
            icon: <TrendingUp className="h-4 w-4" />,
            iconWrap: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Class Average",
            value: fmtScore(latest?.overall),
            hint: "Current Overall Score",
            icon: <Users className="h-4 w-4" />,
            iconWrap:
              "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
          },
          {
            label: "Best Improvement",
            value:
              bestImprove?.delta == null
                ? "—"
                : `${bestImprove.delta > 0 ? "+" : ""}${bestImprove.delta.toFixed(0)}%`,
            hint: bestImprove?.team.name ?? "Since first processed round",
            icon: <Target className="h-4 w-4" />,
            iconWrap: "bg-orange-50 text-[var(--portal-brand)]",
          },
          {
            label: "Most Consistent",
            value: mostConsistent?.team.name ?? "—",
            hint: "Lowest Variance",
            icon: <LineChartIcon className="h-4 w-4" />,
            iconWrap: "bg-violet-50 text-violet-700",
          },
          {
            label: "Trend Reliability",
            value: reliability,
            hint: `Based on ${closed.length} completed rounds`,
            icon: <CalendarDays className="h-4 w-4" />,
            iconWrap: "bg-sky-50 text-sky-700",
          },
        ]}
      />

      <ProfessorTabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overall", label: "Overall Performance" },
          { id: "perspective", label: "By Perspective" },
          { id: "teams", label: "Team Trends" },
          { id: "distribution", label: "Performance Distribution" },
        ]}
      />

      {tab === "overall" || tab === "perspective" ? (
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--portal-title)]">
              {tab === "overall"
                ? "Class Average Performance Over Time"
                : "Performance by Perspective Over Time"}
            </h2>
            <p className="text-[0.6875rem] text-[var(--portal-muted)]">
              Overall Score across processed rounds
            </p>
            <div className="mt-4 h-56">
              {series.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-[var(--portal-muted)]">
                  No processed rounds yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid stroke="#eef1f4" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    {tab === "overall" || perspective === "all" ? (
                      <Line
                        type="monotone"
                        dataKey="overall"
                        stroke="#2F6FED"
                        strokeWidth={2}
                        name="Overall"
                      />
                    ) : null}
                    {tab === "perspective" &&
                    (perspective === "all" || perspective === "financial") ? (
                      <Line
                        type="monotone"
                        dataKey="financial"
                        stroke="#FF560F"
                        name="Financial"
                      />
                    ) : null}
                    {tab === "perspective" &&
                    (perspective === "all" || perspective === "employee") ? (
                      <Line
                        type="monotone"
                        dataKey="employee"
                        stroke="#16a34a"
                        name="Employee"
                      />
                    ) : null}
                    {tab === "perspective" &&
                    (perspective === "all" || perspective === "process") ? (
                      <Line
                        type="monotone"
                        dataKey="process"
                        stroke="#7c3aed"
                        name="Internal Process"
                      />
                    ) : null}
                    {tab === "perspective" &&
                    (perspective === "all" || perspective === "learning") ? (
                      <Line
                        type="monotone"
                        dataKey="learning"
                        stroke="#0ea5e9"
                        name="Learning & Growth"
                      />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--portal-title)]">
              Performance Summary
            </h2>
            <p className="text-[0.6875rem] text-[var(--portal-muted)]">
              Change from first processed round
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              {([
                ["Financial", pctDelta(latest?.financial ?? null, first?.financial ?? null), CircleDollarSign, "text-emerald-600"],
                ["Employee", pctDelta(latest?.employee ?? null, first?.employee ?? null), Users, "text-[var(--portal-accent-blue)]"],
                ["Internal Process", pctDelta(latest?.process ?? null, first?.process ?? null), Target, "text-orange-500"],
                ["Learning & Growth", pctDelta(latest?.learning ?? null, first?.learning ?? null), BookOpen, "text-violet-600"],
                ["Overall Score", overallTrend, TrendingUp, "text-emerald-600"],
              ] as const).map(([label, value, Icon, tone], i) => (
                <div
                  key={String(label)}
                  className={`flex justify-between gap-3 ${
                    i === 4 ? "border-t border-[var(--portal-sidebar-border)] pt-3" : ""
                  }`}
                >
                  <dt className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${tone}`} strokeWidth={2} />
                    {label}
                  </dt>
                  <dd
                    className={`tabular-nums font-semibold ${
                      value == null
                        ? ""
                        : value > 0
                          ? "text-emerald-600"
                          : value < 0
                            ? "text-rose-600"
                            : ""
                    }`}
                  >
                    {value == null
                      ? "—"
                      : `${value > 0 ? "+" : ""}${value.toFixed(0)}%`}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      ) : null}

      {tab === "overall" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {perspectiveCard}
          {improvingCard}
        </div>
      ) : null}

      {tab === "teams" ? (
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--portal-title)]">
            Top Improving Teams
          </h2>
          <p className="text-[0.6875rem] text-[var(--portal-muted)]">
            Overall score change from first to latest processed round
          </p>
          <ul className="mt-4 space-y-3">
            {[...teamDeltas]
              .sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999))
              .map((row) => (
                <li
                  key={row.team.id}
                  className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm"
                >
                  <span className="truncate">{row.team.name}</span>
                  <span className="h-2 overflow-hidden rounded bg-[#eef1f4]">
                    <span
                      className={`block h-full ${
                        (row.delta ?? 0) < 0 ? "bg-rose-400" : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.abs(row.delta ?? 0) * 2)}%`,
                      }}
                    />
                  </span>
                  <span className="tabular-nums text-[var(--portal-muted)]">
                    {row.delta == null
                      ? "—"
                      : `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(0)}%`}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {tab === "distribution" ? (
        <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Round</th>
                <th className="px-4 py-3 whitespace-nowrap">Teams with Results</th>
                <th className="px-4 py-3 whitespace-nowrap">Class Avg BSC</th>
              </tr>
            </thead>
            <tbody>
              {series.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-[var(--portal-muted)]"
                  >
                    No processed rounds yet.
                  </td>
                </tr>
              ) : (
                series.map((row) => (
                  <tr
                    key={row.name}
                    className="border-t border-[var(--portal-sidebar-border)]"
                  >
                    <td className="px-4 py-3 font-semibold">{row.name}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {
                        scores.filter(
                          (s) => s.roundId === row.id && s.overall != null
                        ).length
                      }
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {fmtScore(row.overall)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      ) : null}

      <ProfessorHelpBanner
        title="Use Trends to Guide Instruction"
        body="Performance trends reveal how teams are learning and adapting. Use these insights to plan debriefs, adjust focus areas, and support student improvement."
      />
    </ProfessorPageGrid>
  );
}
