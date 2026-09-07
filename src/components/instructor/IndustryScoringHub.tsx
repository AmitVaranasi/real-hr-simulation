"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  Settings,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
  FilterCard,
  KpiBoard,
  RankBadge,
  ViewByToggle,
} from "@/components/instructor/ClassPerformanceShared";
import {
  avg,
  fmtScore,
  type PerformanceTeam,
  type ScoreRow,
} from "@/lib/instructor/class-performance-data";

type RoundOpt = { id: string; label: string; status: string };

export function IndustryScoringHub({
  sessionId,
  rail,
  teams,
  rounds,
  scores,
  children,
}: {
  sessionId: string;
  rail: CourseRailState;
  teams: PerformanceTeam[];
  rounds: RoundOpt[];
  scores: ScoreRow[];
  children?: ReactNode;
}) {
  const closed = rounds.filter((r) => r.status === "closed");
  const [roundId, setRoundId] = useState(
    closed[closed.length - 1]?.id ?? rounds[0]?.id ?? ""
  );
  const [industry, setIndustry] = useState("all");
  const [strategy, setStrategy] = useState("all");
  const [viewBy, setViewBy] = useState("bsc");

  const focus = rounds.find((r) => r.id === roundId) ?? null;
  const industries = [...new Set(teams.map((t) => t.industry).filter(Boolean))];
  const strategies = [...new Set(teams.map((t) => t.strategy).filter(Boolean))];

  const visible = useMemo(
    () =>
      teams.filter((t) => {
        if (industry !== "all" && t.industry !== industry) return false;
        if (strategy !== "all" && t.strategy !== strategy) return false;
        return true;
      }),
    [industry, strategy, teams]
  );

  const roundScores = scores.filter((s) => s.roundId === focus?.id);
  const classAvg = {
    overall: avg(
      visible.map((t) => roundScores.find((s) => s.teamId === t.id)?.overall ?? null)
    ),
    financial: avg(
      visible.map((t) => roundScores.find((s) => s.teamId === t.id)?.financial ?? null)
    ),
    employee: avg(
      visible.map((t) => roundScores.find((s) => s.teamId === t.id)?.employee ?? null)
    ),
    process: avg(
      visible.map((t) => roundScores.find((s) => s.teamId === t.id)?.process ?? null)
    ),
    learning: avg(
      visible.map((t) => roundScores.find((s) => s.teamId === t.id)?.learning ?? null)
    ),
  };

  const chart = [
    { name: "Overall", class: classAvg.overall, industry: null },
    { name: "Financial", class: classAvg.financial, industry: null },
    { name: "Employee", class: classAvg.employee, industry: null },
    { name: "Internal Process", class: classAvg.process, industry: null },
    { name: "Learning & Growth", class: classAvg.learning, industry: null },
  ];

  const ranked = [...visible]
    .map((team) => ({
      team,
      score: roundScores.find((s) => s.teamId === team.id),
    }))
    .sort((a, b) => (b.score?.overall ?? -1) - (a.score?.overall ?? -1));

  const inspectHref = `/sessions/${sessionId}/inspect`;

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
              body: "Export decision and scoring data for analysis.",
              action: "Export Data",
              href: "/sessions/class-performance/analytics",
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
        title="Industry Scoring"
        subtitle="Evaluate class performance relative to the industry benchmark across Balanced Scorecard perspectives."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance", href: "/sessions/class-performance" },
          { label: "Industry Scoring" },
        ]}
        actions={
          <Link
            href="/sessions/class-performance/analytics"
            className="rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
          >
            Export Scores
          </Link>
        }
      />

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
              {r.status === "open" ? " (Current)" : ""}
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

      <KpiBoard
        tiles={[
          {
            label: "Class Overall Score",
            value: fmtScore(classAvg.overall),
            hint: "vs. Industry Benchmark —",
            icon: <Users className="h-4 w-4" />,
            iconWrap:
              "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
          },
          {
            label: "Financial",
            value: fmtScore(classAvg.financial),
            hint: "vs. Industry Benchmark —",
            icon: <BookOpen className="h-4 w-4" />,
            iconWrap: "bg-orange-50 text-[var(--portal-brand)]",
          },
          {
            label: "Employee",
            value: fmtScore(classAvg.employee),
            hint: "vs. Industry Benchmark —",
            icon: <Users className="h-4 w-4" />,
            iconWrap: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Internal Process",
            value: fmtScore(classAvg.process),
            hint: "vs. Industry Benchmark —",
            icon: <Settings className="h-4 w-4" />,
            iconWrap: "bg-violet-50 text-violet-700",
          },
          {
            label: "Learning & Growth",
            value: fmtScore(classAvg.learning),
            hint: "vs. Industry Benchmark —",
            icon: <GraduationCap className="h-4 w-4" />,
            iconWrap: "bg-sky-50 text-sky-700",
          },
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Class Performance vs. Industry Benchmark
          </h2>
          <p className="mt-1 text-[0.6875rem] text-[var(--portal-muted)]">
            Industry benchmark values are not stored. Bars show class averages
            from processed outcomes.
          </p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid stroke="#eef1f4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="class" fill="#2F6FED" name="Class Average" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Industry Benchmark Summary
          </h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="py-2 whitespace-nowrap">Perspective</th>
                <th className="py-2 whitespace-nowrap">Class Score</th>
                <th className="py-2 whitespace-nowrap">Industry Benchmark</th>
                <th className="py-2 whitespace-nowrap">Difference</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Overall", classAvg.overall],
                ["Financial", classAvg.financial],
                ["Employee", classAvg.employee],
                ["Internal Process", classAvg.process],
                ["Learning & Growth", classAvg.learning],
              ].map(([label, value]) => (
                <tr
                  key={String(label)}
                  className="border-t border-[var(--portal-sidebar-border)]"
                >
                  <td className="py-2">{label}</td>
                  <td className="py-2 tabular-nums">{fmtScore(value as number | null)}</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-title)]">
            Team Performance vs. Industry Benchmark
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Rank</th>
                <th className="px-4 py-3 whitespace-nowrap">Team</th>
                <th className="px-4 py-3 whitespace-nowrap">Industry</th>
                <th className="px-4 py-3 whitespace-nowrap">Overall</th>
                <th className="px-4 py-3 whitespace-nowrap">vs. Industry</th>
                {viewBy === "bsc" || viewBy === "financial" ? (
                  <th className="px-4 py-3 whitespace-nowrap">Financial</th>
                ) : null}
                {viewBy === "bsc" || viewBy === "employee" ? (
                  <th className="px-4 py-3 whitespace-nowrap">Employee</th>
                ) : null}
                {viewBy === "bsc" || viewBy === "process" ? (
                  <th className="px-4 py-3 whitespace-nowrap">Internal Process</th>
                ) : null}
                {viewBy === "bsc" ? (
                  <th className="px-4 py-3 whitespace-nowrap">Learning & Growth</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {ranked.map((row, i) => (
                <tr
                  key={row.team.id}
                  className="border-t border-[var(--portal-sidebar-border)]"
                >
                  <td className="px-4 py-3">
                    <RankBadge
                      rank={row.score?.overall == null ? null : i + 1}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.team.name}</p>
                    <p className="text-[0.6875rem] text-[var(--portal-muted)]">
                      {row.team.memberCount
                        ? `${row.team.memberCount} members`
                        : "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">{row.team.industry}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {fmtScore(row.score?.overall)}
                  </td>
                  <td className="px-4 py-3">—</td>
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
                  {viewBy === "bsc" || viewBy === "process" ? (
                    <td className="px-4 py-3 tabular-nums">
                      {fmtScore(row.score?.process)}
                    </td>
                  ) : null}
                  {viewBy === "bsc" ? (
                    <td className="px-4 py-3 tabular-nums">
                      {fmtScore(row.score?.learning)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {children}

      <ProfessorHelpBanner
        title="How to Use Industry Scoring"
        body="Focus on perspectives where your class is below the industry benchmark. Review team-level differences and decision patterns to identify teaching opportunities. Industry comparison stays — until a stored benchmark exists."
      />
    </ProfessorPageGrid>
  );
}
