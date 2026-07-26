"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { generateClassExcel, type ClassExportData } from "@/lib/export/excel";
import { generateTeamPdf, outcomeToPdfData } from "@/lib/export/pdf";
import { ScoreOverrideDialog } from "@/components/instructor/ScoreOverrideDialog";
import { formSelectClassName } from "@/components/ui/form-controls";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface ReportsData {
  session: { id: string; name: string };
  teams: Array<{
    id: string;
    name: string;
    industry: string;
    strategy: string;
  }>;
  rounds: Array<{ id: string; round_number: number; round_type: string }>;
  outcomes: Array<Record<string, unknown>>;
  decisions: Array<Record<string, unknown>>;
  reflections: Array<Record<string, unknown>>;
}

function decisionSummary(d: Record<string, unknown>) {
  const positions = d.positions_to_fill_json;
  let hireCount = Number(d.positions_to_fill ?? 0);
  if (Array.isArray(positions)) {
    hireCount = positions.reduce(
      (s: number, p: { count?: number }) => s + Number(p.count ?? 0),
      0
    );
  }
  return {
    hireCount,
    screening: d.screening_rigor,
    diversityGoal: d.diversity_goal_pct,
    trainingPct: d.pct_employees_trained,
    benefits: d.benefits_pct,
    bonus: d.bonus_tier,
    conflict: d.conflict_approach,
    submitted: !!d.is_submitted,
  };
}

export function ReportsClient({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<ReportsData | null>(null);
  const [tab, setTab] = useState<
    "analytics" | "comparison" | "participation" | "decisions" | "export"
  >("analytics");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("");

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/reports`)
      .then((r) => r.json())
      .then(setData);
  }, [sessionId]);

  const analytics = useMemo(() => {
    if (!data) return null;
    const scoreChart = data.teams.map((team) => {
      const outs = data.outcomes.filter((o) => o.team_id === team.id);
      const latest = outs[outs.length - 1];
      return {
        name: team.name,
        score: latest
          ? Number(latest.instructor_override ?? latest.total_score)
          : 0,
        financial: latest ? Number(latest.score_financial ?? 0) : 0,
        employee: latest ? Number(latest.score_employee ?? 0) : 0,
        process: latest ? Number(latest.score_process ?? 0) : 0,
        learning: latest ? Number(latest.score_learning ?? 0) : 0,
      };
    });

    const budgetChart = data.teams.map((team) => {
      const outs = data.outcomes.filter((o) => o.team_id === team.id);
      const latest = outs[outs.length - 1];
      return {
        name: team.name,
        adherence: latest ? Number(latest.budget_adherence ?? 0) : 0,
      };
    });

    const scores = scoreChart.map((r) => r.score).filter((s) => s > 0);
    const avgScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;
    const submitted = data.decisions.filter((d) => d.is_submitted).length;
    const expected = data.teams.length * data.rounds.length;

    return {
      scoreChart,
      budgetChart,
      avgScore,
      submitted,
      expected,
      outcomeCount: data.outcomes.length,
    };
  }, [data]);

  if (!data) {
    return <p className="text-slate-500">Loading reports…</p>;
  }

  const exportData: ClassExportData = {
    sessionName: data.session.name,
    teams: data.teams.map((t) => ({
      id: t.id,
      name: t.name,
      industry: t.industry,
      strategy: t.strategy,
    })),
    rounds: data.rounds,
    outcomes: data.outcomes,
    decisions: data.decisions,
    reflections: data.reflections,
  };

  const tabs = [
    { id: "analytics" as const, label: "Class analytics" },
    { id: "comparison" as const, label: "Comparison" },
    { id: "participation" as const, label: "Participation" },
    { id: "decisions" as const, label: "Decisions" },
    { id: "export" as const, label: "Export" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "analytics" && analytics && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Class avg BSC</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {analytics.avgScore != null
                  ? analytics.avgScore.toFixed(1)
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">
                Decisions submitted
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {analytics.submitted}
                <span className="text-base font-normal text-slate-500">
                  {" "}
                  / {analytics.expected || "—"}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Outcomes scored</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {analytics.outcomeCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">
              Latest team BSC scores
            </h3>
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.scoreChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="financial" stackId="a" fill="#4f46e5" name="Financial" />
                  <Bar dataKey="employee" stackId="a" fill="#0ea5e9" name="Employee" />
                  <Bar dataKey="process" stackId="a" fill="#10b981" name="Process" />
                  <Bar dataKey="learning" stackId="a" fill="#f59e0b" name="Learning" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">
              Budget adherence (latest round)
            </h3>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.budgetChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 120]} unit="%" />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(0)}%`} />
                  <Bar dataKey="adherence" fill="#6366f1" name="Adherence %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "comparison" && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Team</th>
                {data.rounds.map((r) => (
                  <th key={r.id} className="px-3 py-2">
                    R{r.round_number}
                  </th>
                ))}
                <th className="px-3 py-2">Avg (competitive)</th>
                <th className="px-3 py-2">Override</th>
                <th className="px-3 py-2">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team) => {
                const teamOutcomes = data.outcomes.filter(
                  (o) => o.team_id === team.id
                );
                const competitive = teamOutcomes.filter((o) => {
                  const r = data.rounds.find((rd) => rd.id === o.round_id);
                  return r?.round_type === "competitive";
                });
                const avg =
                  competitive.length > 0
                    ? competitive.reduce(
                        (s, o) =>
                          s +
                          Number(o.instructor_override ?? o.total_score),
                        0
                      ) / competitive.length
                    : null;
                return (
                  <tr key={team.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{team.name}</td>
                    {data.rounds.map((r) => {
                      const o = teamOutcomes.find((x) => x.round_id === r.id);
                      return (
                        <td key={r.id} className="px-3 py-2 text-center">
                          {o
                            ? Number(
                                o.instructor_override ?? o.total_score
                              ).toFixed(1)
                            : "—"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-semibold">
                      {avg?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={`text-xs ${formSelectClassName}`}
                        onChange={(e) => {
                          setSelectedTeam(team.id);
                          setSelectedRound(e.target.value);
                        }}
                        defaultValue=""
                      >
                        <option value="">Round…</option>
                        {data.rounds
                          .filter((r) =>
                            teamOutcomes.some((o) => o.round_id === r.id)
                          )
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              R{r.round_number}
                            </option>
                          ))}
                      </select>
                      {selectedTeam === team.id && selectedRound && (
                        <ScoreOverrideDialog
                          teamId={team.id}
                          roundId={selectedRound}
                          currentScore={
                            Number(
                              teamOutcomes.find(
                                (o) => o.round_id === selectedRound
                              )?.total_score
                            ) || 0
                          }
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {teamOutcomes.length > 0 && (
                        <a
                          href={`/sessions/${sessionId}/inspect?team=${team.id}&round=${teamOutcomes[teamOutcomes.length - 1]!.round_id}`}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Latest
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "participation" && (
        <table className="mt-6 w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Team</th>
              <th className="px-3 py-2">Round</th>
              <th className="px-3 py-2">Decision submitted</th>
              <th className="px-3 py-2">Reflection</th>
            </tr>
          </thead>
          <tbody>
            {data.teams.flatMap((team) =>
              data.rounds.map((round) => {
                const dec = data.decisions.find(
                  (d) => d.team_id === team.id && d.round_id === round.id
                );
                const ref = data.reflections.find(
                  (r) => r.team_id === team.id && r.round_id === round.id
                );
                return (
                  <tr key={`${team.id}-${round.id}`} className="border-t">
                    <td className="px-3 py-2">{team.name}</td>
                    <td className="px-3 py-2">R{round.round_number}</td>
                    <td className="px-3 py-2">
                      {dec?.is_submitted ? "Yes" : "No"}
                      {dec?.submitted_at
                        ? ` (${new Date(String(dec.submitted_at)).toLocaleDateString()})`
                        : ""}
                    </td>
                    <td className="px-3 py-2">{ref ? "Yes" : "No"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      {tab === "decisions" && (
        <div className="mt-6 space-y-4">
          <select
            className={formSelectClassName}
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">Select team…</option>
            {data.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {selectedTeam && (
            <div className="space-y-3">
              {data.decisions
                .filter((d) => d.team_id === selectedTeam)
                .map((d) => {
                  const round = data.rounds.find((r) => r.id === d.round_id);
                  const summary = decisionSummary(d);
                  const outcome = data.outcomes.find(
                    (o) =>
                      o.team_id === selectedTeam && o.round_id === d.round_id
                  );
                  return (
                    <div
                      key={String(d.id)}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          Round {round?.round_number ?? "?"} (
                          {round?.round_type})
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            summary.submitted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {summary.submitted ? "Submitted" : "Draft"}
                        </span>
                      </div>
                      <dl className="mt-3 grid gap-1 sm:grid-cols-2">
                        <dt className="text-slate-500">Hires planned</dt>
                        <dd>{summary.hireCount}</dd>
                        <dt className="text-slate-500">Screening rigor</dt>
                        <dd>{String(summary.screening)}</dd>
                        <dt className="text-slate-500">Diversity goal</dt>
                        <dd>{formatPercent(Number(summary.diversityGoal))}</dd>
                        <dt className="text-slate-500">% trained</dt>
                        <dd>{formatPercent(Number(summary.trainingPct))}</dd>
                        <dt className="text-slate-500">Benefits / bonus</dt>
                        <dd>
                          {String(summary.benefits)}% / {String(summary.bonus)}%
                        </dd>
                        <dt className="text-slate-500">Conflict approach</dt>
                        <dd className="capitalize">{String(summary.conflict)}</dd>
                        {outcome && (
                          <>
                            <dt className="text-slate-500">BSC score</dt>
                            <dd className="font-medium text-indigo-700">
                              {Number(
                                outcome.instructor_override ?? outcome.total_score
                              ).toFixed(1)}
                            </dd>
                            <dt className="text-slate-500">Profit</dt>
                            <dd>
                              {formatCurrency(Number(outcome.profit ?? 0))}
                            </dd>
                          </>
                        )}
                      </dl>
                    </div>
                  );
                })}
              {data.decisions.filter((d) => d.team_id === selectedTeam)
                .length === 0 && (
                <p className="text-sm text-slate-500">No decisions yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "export" && (
        <div className="mt-6 space-y-4">
          <Button onClick={() => generateClassExcel(exportData)}>
            Download Excel (full class)
          </Button>
          <div className="flex flex-wrap gap-2">
            {data.teams.map((team) => {
              const lastOutcome = data.outcomes
                .filter((o) => o.team_id === team.id)
                .pop();
              if (!lastOutcome) return null;
              const round = data.rounds.find(
                (r) => r.id === lastOutcome.round_id
              );
              return (
                <Button
                  key={team.id}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    generateTeamPdf(
                      outcomeToPdfData(
                        data.session.name,
                        team,
                        round?.round_number ?? 0,
                        lastOutcome
                      )
                    )
                  }
                >
                  PDF: {team.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
