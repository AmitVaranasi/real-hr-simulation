"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CircleDollarSign,
  Download,
  FileText,
  Lightbulb,
  ListFilter,
  Target,
  Users,
} from "lucide-react";
import {
  ProfessorHelpBanner,
  ProfessorPageGrid,
  ProfessorStandardRail,
  ProfessorTabBar,
  type CourseRailState,
  plural,
} from "@/components/instructor/ProfessorChrome";
import { ProfessorPageHeader } from "@/components/instructor/ProfessorShell";
import {
  AreaSpendAxis,
  AreaSpendBar,
  DeltaPill,
  FilterCard,
  KpiBoard,
  RankBadge,
  compactUsd,
  spendAxisMax,
} from "@/components/instructor/ClassPerformanceShared";
import {
  DECISION_AREAS,
  avg,
  type PerformanceRound,
  type PerformanceTeam,
  type ScoreRow,
  type SpendRow,
} from "@/lib/instructor/class-performance-data";
import { DISCRETIONARY_BUDGET } from "@/lib/engine/defaults";
import { formatCurrency } from "@/lib/utils";

function stdDev(values: number[]) {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function variationTone(level: string) {
  if (level === "High") return "bg-[#fff1e8] text-[#ff5a00]";
  if (level === "Medium") return "bg-[#fff6e0] text-[#b47a00]";
  if (level === "Low") return "bg-[#e8f7ee] text-[#159b55]";
  return "bg-[#f1f3f5] text-[var(--portal-muted)]";
}

function roundHint(round: PerformanceRound | null) {
  if (round?.economy_condition) {
    return (
      round.economy_condition.charAt(0).toUpperCase() +
      round.economy_condition.slice(1)
    );
  }
  if (round?.round_type === "practice") return "Practice";
  if (round?.round_type === "competitive") return "Competitive";
  return round ? "Selected round" : "No rounds";
}

function variationLevel(value: number | null) {
  if (value == null) return "—";
  if (value >= 20_000) return "High";
  if (value >= 10_000) return "Medium";
  return "Low";
}

function teamInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function DecisionAnalysisHub({
  sessionId,
  rail,
  teams,
  rounds,
  scores,
  spends,
}: {
  sessionId: string;
  rail: CourseRailState;
  teams: PerformanceTeam[];
  rounds: PerformanceRound[];
  scores: ScoreRow[];
  spends: SpendRow[];
}) {
  const [roundId, setRoundId] = useState(rounds[rounds.length - 1]?.id ?? "");
  const [teamFilter, setTeamFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [tab, setTab] = useState("spending");
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const focus = rounds.find((r) => r.id === roundId) ?? rounds[0] ?? null;
  const visibleTeams = useMemo(
    () =>
      teamFilter === "all"
        ? teams
        : teams.filter((t) => t.id === teamFilter),
    [teamFilter, teams]
  );

  const roundSpends = spends.filter((s) => s.roundId === focus?.id);
  const roundScores = scores.filter((s) => s.roundId === focus?.id);
  const areaAvgs = DECISION_AREAS.map((area) => {
    const values = visibleTeams
      .map(
        (t) =>
          roundSpends.find((s) => s.teamId === t.id)?.areas[area.key] ?? null
      )
      .filter((v): v is number => v != null);
    return { ...area, mean: avg(values), deviation: stdDev(values) };
  });
  const filteredAreas =
    areaFilter === "all"
      ? areaAvgs
      : areaAvgs.filter((a) => a.key === areaFilter);
  const totalAvg = avg(areaAvgs.map((a) => a.mean));
  const maxArea = spendAxisMax(areaAvgs.map((a) => a.mean));

  const perspectives = [
    {
      label: "Financial",
      value: avg(visibleTeams.map((t) => roundScores.find((s) => s.teamId === t.id)?.financial ?? null)),
    },
    {
      label: "Employee",
      value: avg(visibleTeams.map((t) => roundScores.find((s) => s.teamId === t.id)?.employee ?? null)),
    },
    {
      label: "Internal Process",
      value: avg(visibleTeams.map((t) => roundScores.find((s) => s.teamId === t.id)?.process ?? null)),
    },
    {
      label: "Learning & Growth",
      value: avg(visibleTeams.map((t) => roundScores.find((s) => s.teamId === t.id)?.learning ?? null)),
    },
  ];
  const scored = perspectives.filter((p) => p.value != null);
  const bestScore = [...scored].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];
  const weakestScore = [...scored].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0];

  const classAvgOverall = avg(roundScores.map((s) => s.overall));
  const ranked = [...visibleTeams]
    .map((team) => {
      const spend = roundSpends.find((s) => s.teamId === team.id);
      const score = roundScores.find((s) => s.teamId === team.id);
      const top = DECISION_AREAS.map((area) => ({
        ...area,
        value: spend?.areas[area.key] ?? null,
      })).sort((a, b) => (b.value ?? -1) - (a.value ?? -1))[0];
      return { team, spend, score, top };
    })
    .sort((a, b) => (b.spend?.total ?? -1) - (a.spend?.total ?? -1));

  const classTotal = ranked.reduce((sum, r) => sum + (r.spend?.total ?? 0), 0);
  const inspectHref = sessionId ? `/sessions/${sessionId}/inspect` : "/sessions/config";
  const pageCount = Math.max(1, Math.ceil(ranked.length / pageSize));
  const paged = ranked.slice(page * pageSize, page * pageSize + pageSize);

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
              href: sessionId ? `/sessions/${sessionId}/reports` : "/sessions",
            },
            {
              title: "Download Data",
              icon: <Download className="h-4 w-4" strokeWidth={1.75} />,
              body: "Export decision and spending data for analysis.",
              action: "Export Data",
              href: "/sessions/class-performance/analytics",
            },
            {
              title: "Rubric & Scoring",
              icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
              body: "Review decision quality rubrics and scoring criteria.",
              action: "View Rubrics",
              href: inspectHref,
            },
          ]}
        />
      }
    >
      <ProfessorPageHeader
        title="Decision Analysis"
        subtitle="Analyze team decisions, spending patterns, and their impact on HR and organizational outcomes."
        info="Compare spending, decision quality, and outcomes for the selected round."
        breadcrumbs={[
          { label: "Dashboard", href: "/sessions" },
          { label: "Class Performance", href: "/sessions/class-performance" },
          { label: "Decision Analysis" },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sessions/class-performance/analytics"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-[var(--portal-accent-blue)]"
            >
              <Download className="h-4 w-4" />
              Export Analysis
            </Link>
            <a
              href="#decision-filters"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--portal-accent-blue)] px-3.5 py-2 text-sm font-semibold text-white"
            >
              <ListFilter className="h-4 w-4" />
              Filters
            </a>
          </div>
        }
      />

      <div id="decision-filters" className="grid gap-2 md:grid-cols-4">
        <FilterCard
          label="Round"
          value={roundId}
          onChange={(id) => {
            setRoundId(id);
            setPage(0);
          }}
          hint={roundHint(focus)}
        >
          {rounds.length === 0 ? <option value="">No rounds</option> : null}
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </FilterCard>
        <FilterCard
          label="Teams"
          value={teamFilter}
          onChange={(id) => {
            setTeamFilter(id);
            setPage(0);
          }}
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
          label="Decision Areas"
          value={areaFilter}
          onChange={setAreaFilter}
          hint="7 Decision Areas"
        >
          <option value="all">All Decision Areas</option>
          {DECISION_AREAS.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </FilterCard>
        <FilterCard label="View By" value="average" onChange={() => undefined} hint="Team Average">
          <option value="average">View By</option>
        </FilterCard>
      </div>

      <KpiBoard
        tiles={[
          {
            label: "Total HR Spend",
            value: classTotal > 0 ? compactUsd(classTotal) : "—",
            hint: "Class Total",
            icon: <CircleDollarSign className="h-4 w-4" />,
            iconWrap: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Avg. Spend per Team",
            value:
              classTotal > 0 && visibleTeams.length > 0
                ? compactUsd(classTotal / visibleTeams.length)
                : "—",
            hint: "Per Round",
            icon: <Users className="h-4 w-4" />,
            iconWrap:
              "bg-[var(--portal-accent-blue-soft)] text-[var(--portal-accent-blue)]",
          },
          {
            label: "Best Performing Area",
            value: bestScore?.label ?? "—",
            hint:
              bestScore?.value != null
                ? `Avg. Score: ${bestScore.value.toFixed(0)}%`
                : "From processed scores",
            icon: <Target className="h-4 w-4" />,
            iconWrap: "bg-orange-50 text-[var(--portal-brand)]",
          },
          {
            label: "Biggest Opportunity",
            value: weakestScore?.label ?? "—",
            hint:
              weakestScore?.value != null
                ? `Avg. Score: ${weakestScore.value.toFixed(0)}%`
                : "Lowest class score",
            icon: <Lightbulb className="h-4 w-4" />,
            iconWrap: "bg-violet-50 text-violet-700",
          },
        ]}
      />

      <ProfessorTabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "spending", label: "Spending Overview" },
          { id: "quality", label: "Decision Quality" },
          { id: "outcomes", label: "Outcomes Impact" },
          { id: "correlation", label: "Decision Correlation" },
        ]}
      />

      {tab === "spending" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--portal-title)]">
              HR Spending by Decision Area
            </h2>
            <p className="text-[0.6875rem] text-[var(--portal-muted)]">
              Class average spending per team
            </p>
            <div className="mt-4 space-y-2.5">
              {filteredAreas.map((area) => (
                <AreaSpendBar
                  key={area.key}
                  label={area.label}
                  value={area.mean}
                  max={maxArea}
                  share={
                    area.mean != null && totalAvg
                      ? (area.mean / (totalAvg * DECISION_AREAS.length)) * 100
                      : null
                  }
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,9.25rem)_minmax(0,1fr)_2.4rem_1.6rem] items-center gap-2">
              <p className="text-[0.5rem] text-[var(--portal-muted)]">
                % = Percentage of Total HR Budget
              </p>
              <AreaSpendAxis max={maxArea} />
              <span />
              <span />
            </div>
          </section>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--portal-title)]">
              Spending Variation Across Teams
            </h2>
            <p className="text-[0.6875rem] text-[var(--portal-muted)]">
              Standard deviation of spending by area
            </p>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="py-2 whitespace-nowrap">Decision Area</th>
                  <th className="py-2 whitespace-nowrap">Std. Deviation</th>
                  <th className="py-2 whitespace-nowrap">Variation Level</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.map((area) => {
                  const level = variationLevel(area.deviation);
                  return (
                    <tr
                      key={area.key}
                      className="border-t border-[var(--portal-sidebar-border)]"
                    >
                      <td className="py-2.5">{area.label}</td>
                      <td className="py-2.5 tabular-nums">
                        {area.deviation == null
                          ? "—"
                          : compactUsd(area.deviation)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold ${variationTone(level)}`}
                        >
                          {level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      ) : tab === "quality" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--portal-title)]">
              Decision Quality by Area
            </h2>
            <p className="text-[0.6875rem] text-[var(--portal-muted)]">
              A stored decision-quality score is not in the engine. Values stay —.
            </p>
            <div className="mt-4 space-y-3">
              {filteredAreas.map((area) => (
                <AreaSpendBar
                  key={area.key}
                  label={area.label}
                  value={null}
                  max={100}
                  share={null}
                />
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--portal-title)]">
              Quality Variation Across Teams
            </h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
                <tr>
                  <th className="py-2 whitespace-nowrap">Decision Area</th>
                  <th className="py-2 whitespace-nowrap">Std. Deviation</th>
                  <th className="py-2 whitespace-nowrap">Variation Level</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.map((area) => (
                  <tr
                    key={area.key}
                    className="border-t border-[var(--portal-sidebar-border)]"
                  >
                    <td className="py-2.5">{area.label}</td>
                    <td className="py-2.5">—</td>
                    <td className="py-2.5">
                      <span className="rounded-md bg-[#f1f3f5] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--portal-muted)]">
                        —
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : tab === "outcomes" ? (
        <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
          <div className="px-4 py-3">
            <h2 className="text-sm font-bold text-[var(--portal-title)]">
              Outcomes Impact
            </h2>
            <p className="text-[0.6875rem] text-[var(--portal-muted)]">
              Processed Balanced Scorecard results for the selected round
            </p>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Team</th>
                <th className="px-4 py-3 whitespace-nowrap">Overall</th>
                <th className="px-4 py-3 whitespace-nowrap">Financial</th>
                <th className="px-4 py-3 whitespace-nowrap">Employee</th>
                <th className="px-4 py-3 whitespace-nowrap">Internal Process</th>
                <th className="px-4 py-3 whitespace-nowrap">Learning & Growth</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row) => (
                <tr
                  key={row.team.id}
                  className="border-t border-[var(--portal-sidebar-border)]"
                >
                  <td className="px-4 py-3 font-semibold">{row.team.name}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.score?.overall?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.score?.financial?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.score?.employee?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.score?.process?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.score?.learning?.toFixed(1) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--portal-title)]">
              Decision Correlation
            </h2>
            <p className="mt-2 text-sm text-[var(--portal-muted)]">
              Spend-to-score correlation is not a stored engine product. Use
              Formula Inspect to trace a team’s inputs.
            </p>
            <p className="mt-4 text-2xl font-bold text-[var(--portal-title)]">—</p>
          </section>
          <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--portal-title)]">
              Formula Inspect
            </h2>
            <p className="mt-2 text-sm text-[var(--portal-muted)]">
              Open the existing inspect path for a processed team and round.
            </p>
            <Link
              href={inspectHref}
              className="mt-4 inline-flex rounded-md border border-[var(--portal-accent-blue)] px-3 py-1.5 text-sm font-semibold text-[var(--portal-accent-blue)]"
            >
              Open Inspect
            </Link>
          </section>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[var(--portal-sidebar-border)] bg-white shadow-sm">
        <div className="px-4 py-3">
          <h2 className="text-sm font-bold text-[var(--portal-title)]">
            Team Decision Summary
          </h2>
          <p className="text-[0.6875rem] text-[var(--portal-muted)]">
            Average spending and decision quality by team
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[0.8125rem] font-semibold text-[var(--portal-muted)]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Rank</th>
                <th className="px-4 py-3 whitespace-nowrap">Team</th>
                <th className="px-4 py-3 whitespace-nowrap">Total HR Spend</th>
                <th className="px-4 py-3 whitespace-nowrap">Decision Quality Score</th>
                <th className="px-4 py-3 whitespace-nowrap">Top Invested Area</th>
                <th className="px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[var(--portal-muted)]"
                  >
                    No teams yet.
                  </td>
                </tr>
              ) : (
                paged.map((row, i) => {
                  const rank = page * pageSize + i + 1;
                  const spendPct =
                    row.spend?.total != null
                      ? (row.spend.total / DISCRETIONARY_BUDGET) * 100
                      : null;
                  const vsClass =
                    row.score?.overall != null && classAvgOverall != null
                      ? row.score.overall - classAvgOverall
                      : null;
                  return (
                    <tr
                      key={row.team.id}
                      className="border-t border-[var(--portal-sidebar-border)]"
                    >
                      <td className="px-4 py-3">
                        <RankBadge
                          rank={row.spend?.total == null ? null : rank}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[0.625rem] font-bold text-[var(--portal-accent-blue)]">
                            {teamInitials(row.team.name)}
                          </span>
                          <span>
                            <span className="block font-semibold text-[var(--portal-title)]">
                              {row.team.name}
                            </span>
                            <span className="block text-[0.6875rem] text-[var(--portal-muted)]">
                              {row.team.memberCount
                                ? `${row.team.memberCount} members`
                                : "—"}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="tabular-nums font-medium">
                          {row.spend?.total != null
                            ? formatCurrency(row.spend.total)
                            : "—"}
                        </p>
                        <p className="text-[0.6875rem] tabular-nums text-[var(--portal-muted)]">
                          {spendPct == null ? "—" : `${spendPct.toFixed(0)}%`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums">
                            {row.score?.overall != null
                              ? `${row.score.overall.toFixed(0)}%`
                              : "—"}
                          </span>
                          <DeltaPill value={vsClass} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {row.top?.value != null ? (
                          <>
                            <p>{row.top.label}</p>
                            <p className="text-[0.6875rem] text-[var(--portal-muted)]">
                              {formatCurrency(row.top.value)}
                            </p>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={inspectHref}
                          className="text-sm font-semibold text-[var(--portal-accent-blue)] hover:underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
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
              {Array.from({ length: pageCount }, (_, i) => (
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
              ))}
            </div>
            <label className="inline-flex items-center gap-1">
              <select
                className="rounded border border-[var(--portal-sidebar-border)] bg-white px-1.5 py-0.5 text-[0.6875rem]"
                value={pageSize}
                onChange={() => setPage(0)}
                aria-label="Teams per page"
              >
                <option value={5}>5 per page</option>
              </select>
            </label>
          </div>
        ) : null}
      </section>

      <ProfessorHelpBanner
        title="Understand Your Team Decisions"
        body="Compare how teams allocate resources across HR areas and how those decisions impact performance. Use insights to guide classroom discussions and coaching."
        href="/sessions/professor-resources/guide"
      />
    </ProfessorPageGrid>
  );
}
