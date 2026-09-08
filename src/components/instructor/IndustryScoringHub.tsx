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
  Legend,
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
import {
  attainableFor,
  resolveIndustryBenchmark,
  toDisplayScale,
  type BenchmarkPerspective,
} from "@/lib/engine/industry-benchmarks";

/**
 * Iteration 5: "Use consistent visual treatment for above-benchmark,
 * near-benchmark, and below-benchmark performance." Near = within one point.
 */
function benchHint(delta: number | null) {
  if (delta == null) return "vs. Industry Benchmark —";
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `vs. Industry Benchmark ${sign}${Math.abs(delta).toFixed(1)}`;
}

function BenchmarkDelta({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-[var(--portal-muted)]">—</span>;
  }
  const near = Math.abs(value) < 1;
  const tone = near
    ? "text-[var(--portal-muted)]"
    : value > 0
      ? "text-emerald-700"
      : "text-red-700";
  return (
    <span className={`font-semibold tabular-nums ${tone}`}>
      {value > 0 ? "+" : value < 0 ? "−" : ""}
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

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

  /**
   * Benchmarks are stored as percent of attainable (strategy-independent).
   * A perspective's raw maximum is the team's Balanced Scorecard weight, so
   * the class-level reference is the benchmark percent applied to the average
   * attainable across the teams in view. Overall is always out of 100.
   */
  const classBenchmark = useMemo(() => {
    const out: Record<BenchmarkPerspective, number | null> = {
      overall: null,
      financial: null,
      employee: null,
      process: null,
      learning: null,
    };
    const perspectives = Object.keys(out) as BenchmarkPerspective[];
    for (const perspective of perspectives) {
      const points = visible
        .map((t) => {
          const bench = resolveIndustryBenchmark(t.industry).values[perspective];
          const attainable = attainableFor(perspective, t.strategy);
          return toDisplayScale(bench, attainable);
        })
        .filter((v): v is number => v != null);
      out[perspective] = points.length ? avg(points) : null;
    }
    return out;
  }, [visible]);

  const benchmarkSource = useMemo(() => {
    const sources = new Set(
      visible.map((t) => resolveIndustryBenchmark(t.industry).source)
    );
    if (sources.has("system")) return "system" as const;
    if (sources.has("fixed")) return "fixed" as const;
    return "none" as const;
  }, [visible]);

  const diff = (
    value: number | null,
    perspective: BenchmarkPerspective
  ): number | null => {
    const bench = classBenchmark[perspective];
    return value == null || bench == null ? null : value - bench;
  };

  const chart = [
    { name: "Overall", class: classAvg.overall, industry: classBenchmark.overall },
    { name: "Financial", class: classAvg.financial, industry: classBenchmark.financial },
    { name: "Employee", class: classAvg.employee, industry: classBenchmark.employee },
    { name: "Internal Process", class: classAvg.process, industry: classBenchmark.process },
    { name: "Learning & Growth", class: classAvg.learning, industry: classBenchmark.learning },
  ];

  const ranked = [...visible]
    .map((team) => ({
      team,
      score: roundScores.find((s) => s.teamId === team.id),
    }))
    .sort((a, b) => (b.score?.overall ?? -1) - (a.score?.overall ?? -1));

  /** A team is measured against its OWN industry, not the class mix. */
  const teamVsIndustry = (team: PerformanceTeam, overall: number | null) => {
    if (overall == null) return null;
    const bench = resolveIndustryBenchmark(team.industry).values.overall;
    const target = toDisplayScale(bench, attainableFor("overall", team.strategy));
    return target == null ? null : overall - target;
  };

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
            hint: benchHint(diff(classAvg.overall, "overall")),
            icon: <Users className="h-4 w-4" />,
            iconWrap:
              "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
          },
          {
            label: "Financial",
            value: fmtScore(classAvg.financial),
            hint: benchHint(diff(classAvg.financial, "financial")),
            icon: <BookOpen className="h-4 w-4" />,
            iconWrap: "bg-orange-50 text-[var(--portal-brand)]",
          },
          {
            label: "Employee",
            value: fmtScore(classAvg.employee),
            hint: benchHint(diff(classAvg.employee, "employee")),
            icon: <Users className="h-4 w-4" />,
            iconWrap: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Internal Process",
            value: fmtScore(classAvg.process),
            hint: benchHint(diff(classAvg.process, "process")),
            icon: <Settings className="h-4 w-4" />,
            iconWrap: "bg-violet-50 text-violet-700",
          },
          {
            label: "Learning & Growth",
            value: fmtScore(classAvg.learning),
            hint: benchHint(diff(classAvg.learning, "learning")),
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
            {benchmarkSource === "none"
              ? "Industry benchmark values have not been supplied yet. Bars show class averages from processed outcomes."
              : benchmarkSource === "system"
                ? "Benchmark generated from simulation performance across this industry."
                : "Benchmark values supplied by the simulation designers."}
          </p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid stroke="#eef1f4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="class" fill="#2F6FED" name="Class Average" />
                <Bar
                  dataKey="industry"
                  fill="#94a3b8"
                  name="Industry Benchmark"
                />
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
              {(
                [
                  ["Overall", classAvg.overall, "overall"],
                  ["Financial", classAvg.financial, "financial"],
                  ["Employee", classAvg.employee, "employee"],
                  ["Internal Process", classAvg.process, "process"],
                  ["Learning & Growth", classAvg.learning, "learning"],
                ] as Array<[string, number | null, BenchmarkPerspective]>
              ).map(([label, value, perspective]) => (
                <tr
                  key={label}
                  className="border-t border-[var(--portal-sidebar-border)]"
                >
                  <td className="py-2">{label}</td>
                  <td className="py-2 tabular-nums">{fmtScore(value)}</td>
                  <td className="py-2 tabular-nums">
                    {fmtScore(classBenchmark[perspective])}
                  </td>
                  <td className="py-2">
                    <BenchmarkDelta value={diff(value, perspective)} />
                  </td>
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
                  <td className="px-4 py-3">
                    <BenchmarkDelta value={teamVsIndustry(row.team, row.score?.overall ?? null)} />
                  </td>
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
