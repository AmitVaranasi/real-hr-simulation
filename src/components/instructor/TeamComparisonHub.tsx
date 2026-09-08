"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CircleDollarSign,
  Download,
  FileText,
  GraduationCap,
  ListFilter,
  Settings,
  Users,
} from "lucide-react";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  type CourseRailState,
  plural,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import {
  DeltaPill,
  FilterCard,
  RankBadge,
  ScoreBar,
} from "@/components/instructor/ClassPerformanceShared";

export type ComparisonRow = {
  teamId: string;
  name: string;
  overall: number | null;
  financial: number | null;
  employee: number | null;
  process: number | null;
  learning: number | null;
  /** Overall score in the previous processed round, for Trend. */
  previousOverall?: number | null;
};

function avg(values: Array<number | null>) {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(value: number | null) {
  return value == null ? "—" : `${value.toFixed(1)}`;
}

export function TeamComparisonHub({
  sessionId,
  roundLabel,
  rows,
  rail,
}: {
  sessionId: string | null;
  roundLabel: string | null;
  rows: ComparisonRow[];
  rail: CourseRailState;
}) {
  /**
   * Iteration 5: an insight must be traceable — "4 teams are behind" has to
   * land on those four teams, not on an unfiltered list the professor then
   * has to search. Round Insights links here with ?standing= and ?perspective=.
   */
  const searchParams = useSearchParams();
  const [teamFilter, setTeamFilter] = useState("all");
  const [perspective, setPerspective] = useState(
    searchParams.get("perspective") ?? "all"
  );
  const [standing, setStanding] = useState(searchParams.get("standing") ?? "all");
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const classMean = useMemo(() => {
    const nums = rows
      .map((r) => r.overall)
      .filter((v): v is number => v != null);
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  }, [rows]);
  const filtered = useMemo(() => {
    let out =
      teamFilter === "all" ? rows : rows.filter((r) => r.teamId === teamFilter);
    if (standing !== "all" && classMean != null) {
      out = out.filter((r) =>
        r.overall == null
          ? false
          : standing === "excelling"
            ? r.overall > classMean
            : r.overall < classMean
      );
    }
    return out;
  }, [classMean, rows, standing, teamFilter]);
  const ranked = [...filtered].sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));
  const classAvg = {
    overall: avg(rows.map((r) => r.overall)),
    financial: avg(rows.map((r) => r.financial)),
    employee: avg(rows.map((r) => r.employee)),
    process: avg(rows.map((r) => r.process)),
    learning: avg(rows.map((r) => r.learning)),
  };
  const reportsHref = sessionId ? `/sessions/${sessionId}/reports` : "/sessions";
  const inspectHref = sessionId ? `/sessions/${sessionId}/inspect` : "/sessions/config";

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
              href: reportsHref,
            },
            {
              title: "Download Data",
              icon: <Download className="h-4 w-4" strokeWidth={1.75} />,
              body: "Export performance data for analysis.",
              action: "Export Data",
              href: reportsHref,
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
        title="Team Comparison"
        subtitle="Compare team performance across all completed rounds and key HR performance areas."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance", href: "/sessions/class-performance" },
          { label: "Team Comparison" },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={reportsHref}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
            >
              <Download className="h-4 w-4" />
              Export Comparison
            </Link>
            <a
              href="#team-filters"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-white"
            >
              <ListFilter className="h-4 w-4" />
              Filters
            </a>
          </div>
        }
      />

      <div id="team-filters" className="grid gap-2 md:grid-cols-4">
        <FilterCard label="Round" value="current" onChange={() => undefined} hint={roundLabel ?? "—"}>
          <option value="current">{roundLabel ?? "No processed round"}</option>
        </FilterCard>
        <FilterCard
          label="Teams"
          value={teamFilter}
          onChange={(id) => {
            setTeamFilter(id);
            setPage(0);
          }}
          hint={plural(rows.length, "Team")}
        >
          <option value="all">All Teams</option>
          {rows.map((row) => (
            <option key={row.teamId} value={row.teamId}>
              {row.name}
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
          label="Standing"
          value={standing}
          onChange={(v) => {
            setStanding(v);
            setPage(0);
          }}
          hint="vs. Class Average"
        >
          <option value="all">All Teams</option>
          <option value="excelling">Above class average</option>
          <option value="behind">Below class average</option>
        </FilterCard>
      </div>

      {standing !== "all" ? (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--portal-accent-blue-soft)] px-3 py-2 text-[0.8125rem] text-[var(--portal-ink)]">
          <span>
            Showing {filtered.length} team{filtered.length === 1 ? "" : "s"}{" "}
            {standing === "excelling" ? "above" : "below"} the class average
            {classMean != null ? ` of ${classMean.toFixed(1)}` : ""}.
          </span>
          <button
            type="button"
            onClick={() => {
              setStanding("all");
              setPage(0);
            }}
            className="font-semibold text-[var(--portal-accent-blue)] hover:underline"
          >
            Show all teams
          </button>
        </p>
      ) : null}

      <div className="grid gap-2 lg:grid-cols-[1.15fr_repeat(4,minmax(0,1fr))]">
        <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-4 py-3 shadow-sm">
          <p className="text-2xl font-bold leading-none text-[var(--portal-title)]">
            {classAvg.overall == null ? "—" : `${classAvg.overall.toFixed(0)}%`}
          </p>
          <p className="mt-1 text-[0.6875rem] text-[var(--portal-title)]">
            Overall Score
          </p>
        </section>
        {[
          {
            label: "Financial",
            value: classAvg.financial,
            icon: <CircleDollarSign className="h-3.5 w-3.5" />,
            iconWrap: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Employee",
            value: classAvg.employee,
            icon: <Users className="h-3.5 w-3.5" />,
            iconWrap:
              "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
          },
          {
            label: "Internal Process",
            value: classAvg.process,
            icon: <Settings className="h-3.5 w-3.5" />,
            iconWrap: "bg-orange-50 text-[var(--portal-brand)]",
          },
          {
            label: "Learning & Growth",
            value: classAvg.learning,
            icon: <GraduationCap className="h-3.5 w-3.5" />,
            iconWrap: "bg-violet-50 text-violet-700",
          },
        ].map((tile) => (
          <section
            key={tile.label}
            className="flex items-start gap-2 rounded-xl border border-[var(--portal-sidebar-border)] bg-white px-3 py-3 shadow-sm"
          >
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tile.iconWrap}`}
            >
              {tile.icon}
            </span>
            <div>
              <p className="text-[0.625rem] text-[var(--portal-title)]">
                {tile.label}
              </p>
              <p className="text-lg font-bold leading-none text-[var(--portal-title)]">
                {tile.value == null ? "—" : `${tile.value.toFixed(0)}%`}
              </p>
              <p className="mt-1 text-[0.5625rem] text-[var(--portal-title)]">
                Class Avg.
              </p>
            </div>
          </section>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-2.5 py-2 whitespace-nowrap" rowSpan={2}>
                  Rank
                </th>
                <th className="px-2.5 py-2 whitespace-nowrap" rowSpan={2}>
                  Team
                </th>
                <th className="px-2.5 py-2 whitespace-nowrap" rowSpan={2}>
                  Overall Score
                </th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap" colSpan={4}>
                  Balanced Scorecard Perspectives
                </th>
                <th className="px-2.5 py-2 whitespace-nowrap" rowSpan={2}>
                  Trend
                </th>
                <th className="px-2.5 py-2 whitespace-nowrap" rowSpan={2}>
                  vs Class Avg.
                </th>
              </tr>
              <tr>
                <th className="px-2.5 py-2 whitespace-nowrap">Financial</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Employee</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Internal Process</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Learning & Growth</th>
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[var(--portal-muted)]">
                    No processed results yet.
                  </td>
                </tr>
              ) : (
                <>
                  {ranked.slice(page * pageSize, page * pageSize + pageSize).map((row, i) => (
                    <tr
                      key={row.teamId}
                      className="border-t border-[var(--portal-sidebar-border)]"
                    >
                      <td className="px-2.5 py-3">
                        <RankBadge
                          rank={
                            row.overall == null ? null : page * pageSize + i + 1
                          }
                        />
                      </td>
                      <td className="px-2.5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[0.5625rem] font-bold text-[var(--portal-accent-blue)]">
                            {row.name
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase() ?? "")
                              .join("") || "—"}
                          </span>
                          <span className="whitespace-nowrap font-semibold text-[var(--portal-title)]">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-2.5 py-3">
                        <ScoreBar value={row.overall} />
                      </td>
                      {perspective === "all" || perspective === "financial" ? (
                        <td className="px-2.5 py-3 tabular-nums">{fmt(row.financial)}</td>
                      ) : (
                        <td className="px-2.5 py-3 text-[var(--portal-muted)]">—</td>
                      )}
                      {perspective === "all" || perspective === "employee" ? (
                        <td className="px-2.5 py-3 tabular-nums">{fmt(row.employee)}</td>
                      ) : (
                        <td className="px-2.5 py-3 text-[var(--portal-muted)]">—</td>
                      )}
                      {perspective === "all" || perspective === "process" ? (
                        <td className="px-2.5 py-3 tabular-nums">{fmt(row.process)}</td>
                      ) : (
                        <td className="px-2.5 py-3 text-[var(--portal-muted)]">—</td>
                      )}
                      {perspective === "all" || perspective === "learning" ? (
                        <td className="px-2.5 py-3 tabular-nums">{fmt(row.learning)}</td>
                      ) : (
                        <td className="px-2.5 py-3 text-[var(--portal-muted)]">—</td>
                      )}
                      <td className="px-2.5 py-3">
                        <DeltaPill
                          value={
                            row.overall == null || row.previousOverall == null
                              ? null
                              : row.overall - row.previousOverall
                          }
                        />
                      </td>
                      <td className="px-2.5 py-3">
                        <DeltaPill
                          value={
                            row.overall == null || classAvg.overall == null
                              ? null
                              : row.overall - classAvg.overall
                          }
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-[var(--portal-sidebar-border)] bg-[#f8f9fb] font-semibold">
                    <td className="px-2.5 py-3">—</td>
                    <td className="px-2.5 py-3">Class Average</td>
                    <td className="px-2.5 py-3 tabular-nums">{fmt(classAvg.overall)}</td>
                    <td className="px-2.5 py-3 tabular-nums">{fmt(classAvg.financial)}</td>
                    <td className="px-2.5 py-3 tabular-nums">{fmt(classAvg.employee)}</td>
                    <td className="px-2.5 py-3 tabular-nums">{fmt(classAvg.process)}</td>
                    <td className="px-2.5 py-3 tabular-nums">{fmt(classAvg.learning)}</td>
                    <td className="px-2.5 py-3">—</td>
                    <td className="px-2.5 py-3">—</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {ranked.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-sidebar-border)] px-4 py-3 text-[0.75rem] text-[var(--portal-muted)]">
            <p>
              Showing {page * pageSize + 1} to{" "}
              {Math.min(ranked.length, page * pageSize + pageSize)} of{" "}
              {ranked.length} teams
            </p>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.max(1, Math.ceil(ranked.length / pageSize)) },
                (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`h-7 w-7 rounded-md text-xs font-semibold ${
                      i === page
                        ? "bg-[var(--portal-accent-blue)] text-white"
                        : "border border-[var(--portal-sidebar-border)] bg-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              )}
            </div>
            <p>5 per page</p>
          </div>
        ) : null}
      </section>

      <ProfessorHelpBanner
        title="Insights for This Round"
        body={
          classAvg.overall == null
            ? "Process a round to populate team comparison from engine results."
            : "Use the live scores above in Teaching & Debrief. This table does not rescore teams."
        }
        href="/sessions/teaching"
        action="View Detailed Report"
      />
    </ProfessorPageGrid>
  );
}
